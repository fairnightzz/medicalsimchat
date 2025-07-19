// app/realtime/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

import SidePanel from "@/components/chat/SidePanel";
import WriteupModal from "@/components/modals/WriteupModal";
import WriteupCard from "@/components/chat/ResultsPanel/WriteupCard";
import FeedbackCard from "@/components/chat/ResultsPanel/FeedbackCard";

import { useRealtimePatient } from "@/hooks/useRealtimePatient";
import type { StructuredWriteup } from "@/lib/structuredWriteupToMarkdown";

export default function RealtimePage() {
  const {
    patient,
    patientSummary,
    allProfiles,
    messages,
    chapterIndex,

    starting,
    connected,
    error,
    encounterEnded,

    livePartialUser,
    livePartialPatient,

    writeupModalOpen,
    setWriteupModalOpen,
    encounterLocked,               // alias: true once write-up submitted
    structuredWriteup,
    gradingLoading,
    gradingResult,
    gradingError,

    actions: {
      startSession,
      stopSession,
      finalizeEncounter,
      newRandomPatient,
      selectPatient,
      submitWriteup
    }
  } = useRealtimePatient();

  const [sideOpen, setSideOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Compose display array (final + partials)
  const displayMessages = useMemo(() => {
    const finals = messages.map(m => ({
      role: m.role,
      text: m.content,
      ts: m.timestamp.getTime(),
      final: !m.partial
    }));
    const partials: typeof finals = [];
    if (livePartialUser)
      partials.push({
        role: "user" as const,
        text: livePartialUser,
        ts: Date.now(),
        final: false
      });
    if (livePartialPatient)
      partials.push({
        role: "assistant" as const,
        text: livePartialPatient,
        ts: Date.now(),
        final: false
      });
    return [...finals, ...partials].sort((a, b) => a.ts - b.ts);
  }, [messages, livePartialUser, livePartialPatient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const disableSwitching = connected || encounterEnded || encounterLocked;

  /* Write-up submission handler */
  const handleSubmitWriteup = async (w: StructuredWriteup) => {
    await submitWriteup(w);
    setWriteupModalOpen(false);
  };

  const profileOptions = useMemo(
    () =>
      allProfiles.map(p => ({
        id: p.id,
        label: p.chiefComplaintSummary || p.name
      })),
    [allProfiles]
  );

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <SidePanel
        open={sideOpen}
        setOpen={setSideOpen}
        patientSummary={
          patientSummary
            ? {
              ...patientSummary,
              affectDescription: patientSummary.affect, // map to sidepanel prop name if needed
            }
            : null
        }
        profiles={profileOptions}
        onSelectPatient={selectPatient}
        onNewPatient={newRandomPatient}
        disableSwitching={disableSwitching}
        encounterLocked={encounterLocked || encounterEnded}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold">Realtime Voice Encounter</h1>
            <p className="text-sm text-gray-400">
              {encounterLocked
                ? "Write‑up submitted — results below."
                : encounterEnded
                  ? "Encounter finalized — prepare and submit your write‑up."
                  : connected
                    ? "Live — speak with the patient."
                    : "Select a patient and start the session."}
            </p>
            {chapterIndex > 0 && !encounterEnded && !encounterLocked && (
              <p className="text-[11px] text-gray-500 mt-1">
                Narrative chapters advanced: {chapterIndex}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!connected && !encounterEnded && !encounterLocked && (
              <Button
                onClick={() => startSession(patient || undefined)}
                disabled={!patientSummary || starting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {starting ? "Starting..." : "Start Session"}
              </Button>
            )}
            {connected && !encounterEnded && !encounterLocked && (
              <>
                <Button
                  variant="outline"
                  onClick={() => stopSession()}
                  className="border-gray-600 bg-gray-700"
                >
                  Stop
                </Button>
                <Button
                  onClick={() => finalizeEncounter()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Finalize
                </Button>
              </>
            )}
            {encounterEnded && !encounterLocked && (
              <Button
                onClick={() => setWriteupModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Submit Write‑Up
              </Button>
            )}

            {/* Submitted (locked) – disabled */}
            {encounterLocked && (
              <Button
                variant="outline"
                disabled
                className="border-gray-600 bg-gray-700 cursor-default opacity-70"
              >
                Write‑Up Submitted
              </Button>
            )}
          </div>
        </header>

        {/* Transcript & Results unified scroll area */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Transcript */}
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

            {!connected && !starting && !encounterEnded && !encounterLocked && (
              <div className="text-sm text-gray-500">
                Press “Start Session” to begin voice encounter.
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400">Error: {error}</div>
            )}

            {/* Results (after submission) */}
            {encounterLocked && (
              <>
                <div className="h-px bg-gray-700/60 my-4" />
                <div className="grid gap-8 md:grid-cols-2">
                  <WriteupCard writeup={structuredWriteup} loading={gradingLoading} />
                  <FeedbackCard
                    gradingResult={gradingResult}
                    gradingError={gradingError}
                    loading={gradingLoading}
                  />
                </div>
              </>
            )}

            <div ref={endRef} />
          </div>
        </div>

        <footer className="border-t border-gray-700 px-6 py-3 text-xs text-gray-500 bg-gray-800">
          Realtime model: configured in <code>/api/realtimeSession</code>
        </footer>
      </div>

      <WriteupModal
        isOpen={writeupModalOpen}
        onClose={() => setWriteupModalOpen(false)}
        onSubmit={handleSubmitWriteup}
      // Optionally pass initialValue from transcript to prefill (e.g. ageGender/chiefComplaint)
      // initialValue={deriveInitialWriteup(structuredWriteup, patientSummary)}
      />
    </div>
  );
}
