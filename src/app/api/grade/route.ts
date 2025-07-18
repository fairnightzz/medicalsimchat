// app/api/grade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PatientProfile } from "@/types/patient";

interface GradeRequestBody {
  writeup: string;
  transcript: { role: "user" | "assistant"; content: string }[];
  patientProfile: PatientProfile;
  finalChapterIndex: number;
}

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as GradeRequestBody;
    const { writeup, transcript, patientProfile, finalChapterIndex } = body;

    if (!writeup || !patientProfile || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: "Missing required fields (writeup, transcript, patientProfile)" },
        { status: 400 }
      );
    }

    // ---- NEW: Separate learner vs patient lines ----
    const learnerTurns = transcript.filter(m => m.role === "user");
    const patientTurns = transcript.filter(m => m.role === "assistant");

    // Compact learner transcript for grading
    const learnerText = learnerTurns
      .map((m, i) => `Turn ${i + 1}: ${m.content}`)
      .join("\n");

    // (Optional) Provide patient responses ONLY as context (not for grading)
    const patientContext = patientTurns
      .map((m, i) => `Patient ${i + 1}: ${m.content}`)
      .join("\n");

    // You may truncate extremely long contexts to save tokens
    const MAX_CHARS = 12000;
    const trimmedLearnerText =
      learnerText.length > MAX_CHARS
        ? learnerText.slice(-MAX_CHARS)
        : learnerText;
    const trimmedPatientContext =
      patientContext.length > MAX_CHARS
        ? patientContext.slice(-MAX_CHARS)
        : patientContext;

    const systemPrompt = `
You are an evaluator of a medical student's clinical ENCOUNTER and WRITE-UP.

IMPORTANT:
- **Grade ONLY the LEARNER TURNS** (student questions / statements).
- Ignore patient wording except to understand sequence.
- Do NOT penalize for anything the patient (assistant) said or did not say.
- If a required element is absent from learner turns *and* the write-up, mark it missed.

Return STRICT JSON ONLY (no markdown, no commentary) with:

{
  "conversationScore": number,            // 0-100
  "writeupCoverageScore": number,         // 0-100
  "overallScore": number,                 // avg of above
  "strengths": string[],                  // up to 3 concise bullets about LEARNER performance
  "improvements": string[],               // up to 3 prioritized actionable bullets for LEARNER
  "missedElements": string[],             // core HPI or history elements missing from write-up (and not clearly asked)
  "hallucinations": string[]              // clinical assertions in write-up not supported by patient profile nor learner questioning
}

SCORING RULES:

1. conversationScore (0-100):
   - Base Coverage Component: (finalChapterIndex / totalChapters) * 60.
   - Open-Ended Quality Component: approximate 0-40 based on proportion of broad, exploratory questions (e.g., "Tell me more about...", "What else...?", "Can you describe..."). Count only LEARNER turns.
   - Clamp total 0-100.

2. writeupCoverageScore (0-100):
   - Core HPI elements list: duration, timing, location, quality, severity, progression, associated positives, associated negatives (denials), functional impact, ICE (ideas/concerns/expectations).
   - Score = (# present in write-up) / (total core) * 100.
   - Presence = explicit mention or clear paraphrase.
   - If hallucinated, still count present but list hallucinations separately.

3. overallScore = (conversationScore + writeupCoverageScore)/2 rounded.

Definitions:
- "missedElements": any core HPI elements absent from write-up (regardless of whether learner asked them earlier).
- "hallucinations": any symptom/sign/fact in write-up NOT in patientProfile fields (narrativeChapters, hpi.*, rosPositive, rosNegatives, pmh.conditions, social.*, etc.).

Constraints:
- strengths / improvements: each < 140 chars, action-focused.
- Use lowercase for element names in missedElements & hallucinations arrays (e.g., "severity", "weight loss").

IF data insufficient, still output a valid JSON with best-effort scoring.
`;

    const userPrompt = `
FINAL CHAPTER INDEX: ${finalChapterIndex}
TOTAL CHAPTERS: ${patientProfile.narrativeChapters.length}

PATIENT PROFILE (GROUND TRUTH JSON):
${JSON.stringify(patientProfile, null, 2)}

LEARNER TURNS ONLY (GRADE THESE):
${trimmedLearnerText || "(no learner turns)"}

PATIENT RESPONSES CONTEXT (DO NOT GRADE):
${trimmedPatientContext || "(no patient responses)"}

LEARNER STRUCTURED WRITE-UP:
${writeup}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.15,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
      throw new Error("No grading content returned from model.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}$/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse grading JSON.");
      }
    }

    // Basic sanity defaults
    parsed.conversationScore ??= 0;
    parsed.writeupCoverageScore ??= 0;
    parsed.overallScore ??= Math.round(
      (parsed.conversationScore + parsed.writeupCoverageScore) / 2
    );
    parsed.strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 3)
      : [];
    parsed.improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements.slice(0, 3)
      : [];
    parsed.missedElements = Array.isArray(parsed.missedElements)
      ? parsed.missedElements
      : [];
    parsed.hallucinations = Array.isArray(parsed.hallucinations)
      ? parsed.hallucinations
      : [];

    return NextResponse.json({ grading: parsed });
  } catch (err: any) {
    console.error("Grade endpoint error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to grade write-up" },
      { status: 500 }
    );
  }
}
