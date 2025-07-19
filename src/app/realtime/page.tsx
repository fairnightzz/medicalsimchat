"use client";
import { useRealtimePatient } from "@/hooks/useRealtimePatient";
import { useState, useMemo, useRef, useEffect } from "react";
import { ChatDisplayMessage } from "@/types/chat";
import MessageList from "@/components/chat/MessageList";
import ChatHeader from "@/components/chat/ChatHeader"; // or make a simpler header
import { Button } from "@/components/ui/button";

export default function RealtimePage() {
  const rt = useRealtimePatient();
  const [personaPrompt, setPersonaPrompt] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const displayMessages: ChatDisplayMessage[] = useMemo(() => {
    const finals: ChatDisplayMessage[] = [
      ...rt.userTranscript.map(t => ({
        id: `u-${t.timestamp}`,
        role: "user" as const,
        content: t.text,
        timestamp: new Date(t.timestamp),
        partial: !t.final,
        source: "realtime" as const,
      })),
      ...rt.patientTranscript.map(t => ({
        id: `p-${t.timestamp}`,
        role: "assistant" as const,
        content: t.text,
        timestamp: new Date(t.timestamp),
        partial: !t.final,
        source: "realtime" as const,
      })),
    ];
    const partials: ChatDisplayMessage[] = [];
    if (rt.livePartialUser) {
      partials.push({
        id: "partial-user",
        role: "user",
        content: rt.livePartialUser,
        timestamp: new Date(),
        partial: true,
        source: "realtime",
      });
    }
    if (rt.livePartialPatient) {
      partials.push({
        id: "partial-patient",
        role: "assistant",
        content: rt.livePartialPatient,
        timestamp: new Date(),
        partial: true,
        source: "realtime",
      });
    }
    return [...finals, ...partials].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }, [rt.userTranscript, rt.patientTranscript, rt.livePartialUser, rt.livePartialPatient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
        <div>
          <h1 className="text-xl font-semibold">Realtime Voice Encounter</h1>
          <p className="text-sm text-gray-400">
            {rt.encounterEnded
              ? "Encounter finalized."
              : rt.connected
                ? "Live — speak to the patient."
                : "Start session to begin voice interview."}
          </p>
        </div>
        <div className="flex gap-2">
          {!rt.connected && (
            <input
              className="bg-gray-700 border border-gray-600 rounded px-2 text-sm"
              placeholder="Persona prompt (optional)"
              value={personaPrompt}
              onChange={e => setPersonaPrompt(e.target.value)}
              disabled={rt.starting}
            />
          )}
          {!rt.connected && (
            <Button
              onClick={() => rt.startSession(personaPrompt || undefined)}
              disabled={rt.starting || !rt.mediaSupported}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {rt.starting ? "Starting..." : "Start Session"}
            </Button>
          )}
          {rt.connected && !rt.encounterEnded && (
            <>
              <Button
                variant="outline"
                onClick={() => rt.stopSession()}
                className="border-gray-600 bg-gray-700"
              >
                Stop (Keep Transcript)
              </Button>
              <Button
                onClick={() => rt.finalizeEncounter()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Finalize
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          <MessageList
            messages={displayMessages}
            loading={rt.starting}
            encounterLocked={rt.encounterEnded}
            endRef={endRef}
          />
          {rt.error && (
            <div className="text-sm text-red-400">
              Error: {rt.error}
            </div>
          )}
          {!rt.mediaSupported && (
            <div className="text-sm text-amber-400">
              Media APIs not supported in this browser.
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-700 px-6 py-3 text-xs text-gray-500 bg-gray-800">
        Realtime model: (configured in /api/realtimeSession)
      </footer>
    </div>
  );
}
