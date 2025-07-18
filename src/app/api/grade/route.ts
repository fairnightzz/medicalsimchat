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

    // Compact transcript (avoid token bloat)
    const transcriptText = transcript
      .map((m) => `${m.role === "user" ? "Learner" : "Patient"}: ${m.content}`)
      .join("\n");

    // VERY BASIC system prompt
    const systemPrompt = `
You are an evaluator of a medical student clinical encounter.
Return concise JSON ONLY (valid JSON). Do not include markdown or commentary.

You will receive:
- Patient Profile (ground truth)
- Final Chapter Index (how many narrative chapters disclosed)
- Conversation Transcript
- Learner Write-Up

Scoring rules (0-100):
- conversationScore: heuristic: (finalChapterIndex / totalChapters) * 60 + openEndedQualityGuess * 40 (approximate open ended quality by presence of broad prompts)
- writeupCoverageScore:  (# of core HPI elements present / total core elements) * 100 (core elements: duration, timing, location, quality, severity, progression, associated positives, associated negatives, functional impact, ICE)
- overallScore: average of conversationScore and writeupCoverageScore.

Also return:
- strengths: up to 3 short bullets.
- improvements: up to 3 prioritized bullets.
- missedElements: list of core elements absent from write-up (strings).
- hallucinations: symptoms asserted in write-up not in patient profile (if any; else empty array).

Output strict JSON with keys:
{
  "conversationScore": number,
  "writeupCoverageScore": number,
  "overallScore": number,
  "strengths": string[],
  "improvements": string[],
  "missedElements": string[],
  "hallucinations": string[]
}
`;

    // Minimal “input packing” for model context
    const userPrompt = `
FINAL CHAPTER INDEX: ${finalChapterIndex}
TOTAL CHAPTERS: ${patientProfile.narrativeChapters.length}

PATIENT PROFILE:
${JSON.stringify(patientProfile, null, 2)}

TRANSCRIPT:
${transcriptText}

LEARNER WRITE-UP:
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
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error("No grading content returned from model.");
    }

    // Attempt to parse JSON; if model added stray text, try to salvage
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Fallback naive extraction of JSON substring
      const match = rawContent.match(/\{[\s\S]*\}$/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse grading JSON.");
      }
    }

    return NextResponse.json({ grading: parsed });
  } catch (err: any) {
    console.error("Grade endpoint error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to grade write-up" },
      { status: 500 }
    );
  }
}
