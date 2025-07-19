// app/api/realtimeSession/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // optional

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const offerSDP = await req.text(); // raw SDP (NOT JSON)
    if (!offerSDP || !offerSDP.includes("v=0")) {
      return NextResponse.json({ error: "Invalid or missing SDP offer" }, { status: 400 });
    }

    const model = "gpt-4o-mini-realtime-preview";

    const upstream = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
          // Do NOT put long patient prompt here.
          // If you *must* seed something tiny & ASCII you can add:
          // "OpenAI-Session-Prompt": "You are a standardized patient.",
        },
        body: offerSDP,
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      return new NextResponse(detail, { status: 502 });
    }

    const answerSDP = await upstream.text();
    return new NextResponse(answerSDP, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unexpected error during realtime init" },
      { status: 500 }
    );
  }
}
