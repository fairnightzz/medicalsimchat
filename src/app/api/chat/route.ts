import { NextRequest, NextResponse } from "next/server";
import { PatientProfile } from "@/lib/patientSimulator";

export async function POST(request: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 },
    );
  }

  try {
    const { messages, patientProfile } = await request.json();

    // Create a system prompt that defines the patient's character
    const systemPrompt = `You are a patient with the following medical condition and characteristics:

Condition: ${patientProfile.condition}
Symptoms: ${patientProfile.symptoms.join(", ")}
Medical History: ${patientProfile.medicalHistory}
Personality Traits: ${patientProfile.personalityTraits.join(", ")}
Age: ${patientProfile.demographicInfo.age}
Gender: ${patientProfile.demographicInfo.gender}
Occupation: ${patientProfile.demographicInfo.occupation || "Not specified"}

You are speaking with a doctor. Respond as this patient would, incorporating your personality traits and symptoms. Be realistic - patients don't always give complete information immediately, may be vague about symptoms, and their personality affects how they communicate. Don't reveal your exact diagnosis directly. Keep responses conversational and natural, as a real patient would speak.`;

    // Make the API call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        max_tokens: 150,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return NextResponse.json({
        response: data.choices[0].message.content.trim(),
      });
    } else {
      throw new Error("No response generated from OpenAI API");
    }
  } catch (error) {
    console.error("Error generating patient response:", error);
    return NextResponse.json(
      { error: "Failed to generate patient response" },
      { status: 500 },
    );
  }
}
