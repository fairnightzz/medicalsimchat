// app/api/realtimeSession/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  try {
    const { offer, personaPrompt } = await req.json();
    if (!offer) return NextResponse.json({ error: "Missing SDP offer" }, { status: 400 });

    const model = "gpt-4o-mini-realtime-preview"; // cheapest realtime model
    const instructions =
      personaPrompt || "You are a standardized patient. Stay in role; be concise.";

    const r = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify({
        sdp: offer,
        session: { instructions }
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json({ error: "Realtime init failed", detail }, { status: 502 });
    }

    const json = await r.json();
    return NextResponse.json({ answer: json.sdp });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unexpected error" }, { status: 500 });
  }
}
