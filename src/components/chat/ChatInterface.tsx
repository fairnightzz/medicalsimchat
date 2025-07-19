"use client";
import { useRef, useEffect, useState, useMemo } from "react";
import SidePanel from "./SidePanel";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import Composer from "./Composer";
import WriteupModal from "@/components/modals/WriteupModal";
import WriteupCard from "./ResultsPanel/WriteupCard";
import FeedbackCard from "./ResultsPanel/FeedbackCard";
import type { StructuredWriteup } from "@/types/grading";
import type { ChatDisplayMessage } from "@/types/chat";

export interface PatientSummary {
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
  messages: ChatDisplayMessage[];
  patientSummary: PatientSummary | null;
  profiles: { id: string; label: string }[];
  loading: boolean;

  writeupModalOpen: boolean;
  setWriteupModalOpen: (open: boolean) => void;

  encounterLocked: boolean;
  structuredWriteup: StructuredWriteup | null;
  gradingResult: GradingResult | null;
  gradingLoading: boolean;
  gradingError: string | null;

  onSendMessage: (text: string) => Promise<void> | void;
  onNewPatient: () => void;
  onSelectPatient: (id: string) => void;
  onSubmitWriteup: (w: StructuredWriteup) => void;
}

export const labelMap: Record<keyof StructuredWriteup, string> = {
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

export default function ChatInterface({
  messages,
  patientSummary,
  profiles,
  loading,
  writeupModalOpen,
  setWriteupModalOpen,
  encounterLocked,
  structuredWriteup,
  gradingResult,
  gradingLoading,
  gradingError,
  onSendMessage,
  onNewPatient,
  onSelectPatient,
  onSubmitWriteup,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, structuredWriteup, gradingResult]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading || encounterLocked) return;
    const text = inputValue.trim();
    setInputValue("");
    await onSendMessage(text);
  };

  const openWriteup = () => {
    if (!encounterLocked) setWriteupModalOpen(true);
  };

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

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <SidePanel
        open={sideMenuOpen}
        setOpen={setSideMenuOpen}
        patientSummary={patientSummary}
        profiles={profiles}
        encounterLocked={encounterLocked}
        onSelectPatient={onSelectPatient}
        onNewPatient={onNewPatient}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader
          encounterLocked={encounterLocked}
          openWriteup={openWriteup}
        />

        <div className="flex-1 overflow-y-auto px-6">
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            <MessageList
              messages={messages}
              loading={loading}
              encounterLocked={encounterLocked}
              endRef={messagesEndRef}
            />
            {encounterLocked && (
              <>
                <div className="h-px bg-gray-700/60 my-2" />
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
          </div>
        </div>

        <Composer
          value={inputValue}
          setValue={setInputValue}
          onSend={handleSend}
          disabled={loading || encounterLocked}
          openWriteup={openWriteup}
          encounterLocked={encounterLocked}
        />
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
}
