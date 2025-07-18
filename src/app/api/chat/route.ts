// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PatientProfile } from "@/types/patient";
import { buildPatientSystemPrompt, isOpenEnded } from "@/lib/buildPatientSystemPrompt";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface IncomingBody {
  messages: ChatMessage[];
  patientProfile: PatientProfile;
  chapterIndex?: number; // how many chapters have already been disclosed
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
    const { messages, patientProfile, chapterIndex = 0 } =
      (await req.json()) as IncomingBody;

    // Determine if last user prompt is open-ended (for potential chapter advancement)
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    const openEnded = lastUser ? isOpenEnded(lastUser.content) : false;

    // Build system prompt with current chapter index (chapters already revealed)
    const systemPrompt = buildPatientSystemPrompt(patientProfile, chapterIndex);

    // Control instruction advising whether to reveal next chapter
    const control = openEnded
      ? "The last learner message appears open-ended. You MAY reveal exactly ONE next unrevealed narrative chapter (if any remain)."
      : "The last learner message appears closed/specific. Do NOT reveal a new narrative chapter; answer only what was asked.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          // Provide a brief runtime control message:
          { role: "system", content: control },
          ...messages
        ],
        max_tokens: 220,
        temperature: 0.8,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content: string | undefined =
      data.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error("No response content from model.");

    // Decide next chapter index (increment only if open-ended AND a chapter remains)
    const total = patientProfile.narrativeChapters.length;
    const newChapterIndex =
      openEnded && chapterIndex < total
        ? chapterIndex + 1
        : chapterIndex;

    return NextResponse.json({
      response: content,
      openEnded,
      nextChapterIndex: newChapterIndex,
    });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json(
      { error: "Failed to generate patient response" },
      { status: 500 }
    );
  }
}
