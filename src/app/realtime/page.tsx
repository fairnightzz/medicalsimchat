// app/realtime/page.tsx
"use client";

import { useRealtimePatient } from "@/hooks/useRealtimePatient";
import { useRealtimePatientProfiles } from "@/hooks/useRealtimePatientProfiles";
import { useMemo, useEffect, useRef, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, RefreshCw, X, Menu } from "lucide-react";

export default function RealtimePage() {
  const { patient, allProfiles, actions, chapterIndex } =
    useRealtimePatientProfiles();

  const rt = useRealtimePatient();
  const endRef = useRef<HTMLDivElement>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(true);

  // Build merged message list
  const displayMessages = useMemo(() => {
    const out: {
      role: "user" | "assistant";
      text: string;
      ts: number;
      final: boolean;
    }[] = [];
    rt.userTranscript.forEach(t =>
      out.push({ role: "user", text: t.text, ts: t.timestamp, final: t.final })
    );
    rt.patientTranscript.forEach(t =>
      out.push({
        role: "assistant",
        text: t.text,
        ts: t.timestamp,
        final: t.final,
      })
    );
    if (rt.livePartialUser)
      out.push({
        role: "user",
        text: rt.livePartialUser,
        ts: Date.now(),
        final: false,
      });
    if (rt.livePartialPatient)
      out.push({
        role: "assistant",
        text: rt.livePartialPatient,
        ts: Date.now(),
        final: false,
      });
    return out.sort((a, b) => a.ts - b.ts);
  }, [
    rt.userTranscript,
    rt.patientTranscript,
    rt.livePartialUser,
    rt.livePartialPatient,
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const start = () => {
    if (!patient) return;
    // Pass patient.id and (optionally) chapterIndex
    rt.startSession(patient, chapterIndex);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Side Menu */}
      <div
        className={`h-full bg-gray-800 border-r border-gray-700 transition-all duration-300 ${sideMenuOpen ? "w-80" : "w-16"
          }`}
      >
        <div className="flex items-center justify-between p-4">
          {sideMenuOpen ? (
            <>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setSideMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white w-full"
              onClick={() => setSideMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {sideMenuOpen && patient && (
          <div className="p-4 space-y-5 text-sm">
            <div className="flex items-center gap-2">
              <Select
                value={patient.id}
                onValueChange={val => {
                  if (rt.connected) return; // don't switch mid-call
                  actions.selectPatient(val);
                }}
                disabled={rt.connected}
              >
                <SelectTrigger className="flex-1 bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.chiefComplaintSummary || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:opacity-50"
                disabled={rt.connected}
                onClick={() => actions.newRandomPatient()}
              >
                <RefreshCw className="h-4 w-4" />
                New
              </Button>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">
                {patient.name}, {patient.age}
                {patient.gender && ` • ${patient.gender}`}
              </div>
              <div className="italic text-gray-300">
                "{patient.openingStatement}"
              </div>
              <div className="text-gray-400">
                CC: {patient.chiefComplaintSummary}
              </div>
              {patient.currentSymptomStatus && (
                <div className="text-gray-400">
                  Status: {patient.currentSymptomStatus}
                </div>
              )}
              {patient.affectDescription && (
                <div className="text-gray-400">
                  Affect: {patient.affectDescription}
                </div>
              )}
              {!!(patient.mannerisms || []).length && (
                <div className="text-gray-400">
                  Mannerisms: {patient.mannerisms!.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold">Realtime Voice Encounter</h1>
            <p className="text-sm text-gray-400">
              {rt.encounterEnded
                ? "Encounter finalized."
                : rt.connected
                  ? "Live — speak with the patient."
                  : "Select patient and start session."}
            </p>
          </div>
          <div className="flex gap-2">
            {!rt.connected && !rt.encounterEnded && (
              <Button
                onClick={start}
                disabled={!patient || rt.starting}
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
                  Stop
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
            {displayMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user"
                    ? "bg-blue-600 text-white ml-12"
                    : "bg-gray-700 text-gray-100 mr-12"
                    } ${!m.final ? "opacity-70 italic" : ""}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {!rt.connected && !rt.starting && (
              <div className="text-sm text-gray-500">
                Press “Start Session” to begin voice encounter.
              </div>
            )}
            {rt.error && (
              <div className="text-sm text-red-400">Error: {rt.error}</div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <footer className="border-t border-gray-700 px-6 py-3 text-xs text-gray-500 bg-gray-800">
          Realtime model configured in <code>/api/realtimeSession</code>
        </footer>
      </div>
    </div>
  );
}
