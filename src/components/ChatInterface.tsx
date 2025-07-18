// components/ChatInterface.tsx
"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Menu, User, RefreshCw, X } from "lucide-react";
import WriteupModal from "./WriteupModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StructuredWriteup } from "@/hooks/usePatientSimulation";

interface UIMessages {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender?: string;
  openingStatement: string;
  chiefComplaintSummary: string;
  currentSymptomStatus?: string;
  affect?: string;
  mannerisms: string[];
  chaptersTotal: number;
  chaptersRevealed: number;
}

interface GradingResult {
  conversationScore: number;
  writeupScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missedConcepts: string[];
  hallucinatedConcepts: string[];
  raw?: any;
}

interface ChatInterfaceProps {
  messages: UIMessages[];
  patientSummary: PatientSummary | null;
  profiles: { id: string; label: string }[];
  loading: boolean;
  writeupModalOpen: boolean;
  encounterLocked: boolean;
  structuredWriteup: StructuredWriteup | null;
  gradingResult: GradingResult | null;
  gradingLoading: boolean;
  gradingError: string | null;
  onSendMessage: (text: string) => Promise<void> | void;
  onNewPatient: () => void;
  onSelectPatient: (id: string) => void;
  onSubmitWriteup: (w: StructuredWriteup) => void;
  setWriteupModalOpen: (open: boolean) => void;
}

const labelMap: Record<keyof StructuredWriteup, string> = {
  ageGender: "Age/Gender",
  chiefComplaint: "Chief Complaint",
  hpi: "History of Present Illness",
  pmh: "Past Medical History",
  immunizations: "Immunizations",
  pastSurgical: "Past Surgical History",
  medications: "Medications",
  medicationAllergies: "Medication Allergies",
  familyHistory: "Family History",
  socialHistory: "Social History",
  sexualHistory: "Sexual History",
  ros: "Review of Systems",
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  patientSummary,
  profiles,
  loading,
  writeupModalOpen,
  encounterLocked,
  structuredWriteup,
  gradingResult,
  gradingLoading,
  gradingError,
  onSendMessage,
  onNewPatient,
  onSelectPatient,
  onSubmitWriteup,
  setWriteupModalOpen,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [sideMenuOpen, setSideMenuOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedProfileId = patientSummary?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, structuredWriteup, gradingResult]);

  const writeupSections = useMemo(() => {
    if (!structuredWriteup) return [];
    return (Object.keys(structuredWriteup) as (keyof StructuredWriteup)[])
      .filter(k => structuredWriteup[k]?.trim())
      .map(k => ({
        key: k,
        label: labelMap[k],
        value: structuredWriteup[k],
      }));
  }, [structuredWriteup]);

  if (!patientSummary) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300">
        Loading patient...
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputValue.trim() || loading || encounterLocked) return;
    const text = inputValue.trim();
    setInputValue("");
    await onSendMessage(text);
  };

  const openWriteup = () => {
    if (!encounterLocked) setWriteupModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Side Menu */}
      <div
        className={`h-full bg-gray-800 transform transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-700 ${sideMenuOpen ? "w-80" : "w-16"
          } overflow-hidden`}
      >
        <div className={`${sideMenuOpen ? "w-80" : "w-16"} h-full`}>
          <div className="flex items-center justify-between p-6">
            {sideMenuOpen ? (
              <>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSideMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSideMenuOpen(true)}
                className="text-gray-400 hover:text-white w-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {sideMenuOpen && (
            <div className="p-4 space-y-5">
              <div className="flex items-center gap-2">
                <Select
                  value={selectedProfileId}
                  onValueChange={(val) => {
                    if (encounterLocked) return;
                    onSelectPatient(val);
                  }}
                  disabled={encounterLocked}
                >
                  <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 disabled:opacity-50">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (encounterLocked) return;
                    onNewPatient();
                  }}
                  className="flex items-center gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:opacity-50"
                  disabled={encounterLocked}
                >
                  <RefreshCw className="h-4 w-4" />
                  New
                </Button>
              </div>

              <div className="text-sm space-y-2">
                <div className="font-semibold">
                  {patientSummary.name}, {patientSummary.age}
                  {patientSummary.gender && ` • ${patientSummary.gender}`}
                </div>
                <div className="italic text-gray-300">
                  "{patientSummary.openingStatement}"
                </div>
                <div className="text-gray-400">
                  CC: {patientSummary.chiefComplaintSummary}
                </div>
                {patientSummary.currentSymptomStatus && (
                  <div className="text-gray-400">
                    Status: {patientSummary.currentSymptomStatus}
                  </div>
                )}
                <div className="text-gray-400">
                  Chapters: {patientSummary.chaptersRevealed}/
                  {patientSummary.chaptersTotal}
                </div>
                {patientSummary.affect && (
                  <div className="text-gray-400">
                    Affect: {patientSummary.affect}
                  </div>
                )}
                {!!patientSummary.mannerisms.length && (
                  <div className="text-gray-400">
                    Mannerisms: {patientSummary.mannerisms.join(", ")}
                  </div>
                )}
                {encounterLocked && (
                  <div className="text-xs text-amber-400 pt-2">
                    Encounter locked.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold">
              Clinical Interview Simulator
            </h1>
            <p className="text-sm text-gray-400">
              {encounterLocked
                ? "Encounter closed — transcript + results below."
                : "Interview the patient, then submit your structured write‑up."}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            onClick={openWriteup}
            disabled={encounterLocked}
          >
            {encounterLocked ? "Write‑Up Submitted" : "Submit Write‑Up"}
          </Button>
        </header>

        {/* Unified scroll area (messages + results) */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            {/* Messages */}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user"
                      ? "bg-blue-600 text-white ml-12"
                      : "bg-gray-700 text-gray-100 mr-12"
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {loading && !encounterLocked && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-700 text-gray-100 mr-12">
                  <p className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-150"></span>
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-300"></span>
                  </p>
                </div>
              </div>
            )}

            {/* Results inserted at end of transcript */}
            {encounterLocked && (
              <>
                {messages.length > 0 && (
                  <div className="h-px bg-gray-700/60 my-2" />
                )}
                <div className="grid gap-8 md:grid-cols-2">
                  <WriteupCard
                    writeup={structuredWriteup}
                    loading={gradingLoading}
                  />
                  <FeedbackCard
                    gradingResult={gradingResult}
                    gradingError={gradingError}
                    loading={gradingLoading}
                  />
                </div>
              </>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-gray-700 px-6 py-4 bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    encounterLocked
                      ? "Encounter locked after write‑up."
                      : "Ask or respond..."
                  }
                  disabled={loading || encounterLocked}
                  className="pr-12 bg-gray-700 border-gray-600 text-white placeholder-gray-500 rounded-xl h-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || encounterLocked || !inputValue.trim()}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={openWriteup}
                variant="outline"
                className="h-12 px-6 rounded-xl border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                disabled={encounterLocked}
              >
                {encounterLocked ? "Locked" : "Write‑Up"}
              </Button>
            </div>
            {loading && !encounterLocked && (
              <div className="text-sm text-gray-400 mt-3 text-center">
                Patient is thinking...
              </div>
            )}
            {encounterLocked && (
              <div className="text-xs text-center text-amber-400 mt-3">
                Encounter closed — further messaging disabled.
              </div>
            )}
          </div>
        </div>
      </div>

      <WriteupModal
        isOpen={writeupModalOpen}
        onClose={() => setWriteupModalOpen(false)}
        onSubmit={(structured) => {
          setWriteupModalOpen(false);
          onSubmitWriteup(structured);
        }}
      />
    </div>
  );
};

export default ChatInterface;

/* ----- Result Cards ----- */

function WriteupCard({
  writeup,
  loading,
}: {
  writeup: StructuredWriteup | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-gray-800/70 border border-gray-700 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4">Submitted Write‑Up</h2>
      {!writeup && !loading && (
        <p className="text-sm text-gray-400">
          No write‑up captured (submission failed?).
        </p>
      )}
      {loading && <p className="text-sm text-gray-400">Scoring…</p>}
      {writeup && !loading && (
        <dl className="space-y-4">
          {(Object.keys(writeup) as (keyof StructuredWriteup)[])
            .filter(k => writeup[k].trim())
            .map(k => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  {labelMap[k]}
                </dt>
                <dd className="text-sm text-gray-100 whitespace-pre-wrap mt-1">
                  {writeup[k]}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  );
}

function FeedbackCard({
  gradingResult,
  gradingError,
  loading,
}: {
  gradingResult: GradingResult | null;
  gradingError: string | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-gray-800/70 border border-gray-700 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4">Automated Feedback</h2>
      {loading && <p className="text-sm text-gray-400">Analyzing write‑up…</p>}
      {gradingError && !loading && (
        <p className="text-sm text-red-400">{gradingError}</p>
      )}
      {!gradingError && gradingResult && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <ScorePill
              label="Conversation"
              value={gradingResult.conversationScore}
            />
            <ScorePill label="Write‑Up" value={gradingResult.writeupScore} />
            <ScorePill label="Overall" value={gradingResult.overallScore} />
          </div>

          <ListSection
            title="Strengths"
            items={gradingResult.strengths}
            emptyText="—"
          />
          <ListSection
            title="Improvements"
            items={gradingResult.improvements}
            emptyText="—"
          />
          <ListSection
            title="Missed Elements"
            items={gradingResult.missedConcepts}
            pill
            emptyText="None"
          />
          <ListSection
            title="Unsubstantiated / Hallucinated"
            items={gradingResult.hallucinatedConcepts}
            pill
            emptyText="None"
          />
        </div>
      )}
      {!gradingResult && !gradingError && !loading && (
        <p className="text-sm text-gray-400">No feedback yet.</p>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-700/60 px-3 py-3">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

function ListSection({
  title,
  items,
  emptyText,
  pill,
}: {
  title: string;
  items: string[];
  emptyText?: string;
  pill?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {items.length === 0 && (
        <div className="text-xs text-gray-500">{emptyText || "None"}</div>
      )}
      {items.length > 0 && !pill && (
        <ul className="list-disc ml-5 space-y-1 text-sm text-gray-200">
          {items.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
      {items.length > 0 && pill && (
        <div className="flex flex-wrap gap-2">
          {items.map((i, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-md bg-gray-700 border border-gray-600 text-gray-200"
            >
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
