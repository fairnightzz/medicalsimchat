// components/ChatInterface.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
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

interface ChatInterfaceProps {
  messages: UIMessages[];
  patientSummary: PatientSummary | null;
  profiles: { id: string; label: string }[];
  loading: boolean;
  writeupModalOpen: boolean;
  onSendMessage: (text: string) => Promise<void> | void;
  onNewPatient: () => void;
  onSelectPatient: (id: string) => void;
  onSubmitWriteup: (writeup: string) => void;
  setWriteupModalOpen: (open: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  patientSummary,
  profiles,
  loading,
  writeupModalOpen,
  onSendMessage,
  onNewPatient,
  onSelectPatient,
  onSubmitWriteup,
  setWriteupModalOpen,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [sideMenuOpen, setSideMenuOpen] = useState(true);
  const [encounterLocked, setEncounterLocked] = useState(false); // lock after write-up submit
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedProfileId = patientSummary?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  const handleWriteupSubmit = (writeup: string) => {
    // Lock further interaction
    setEncounterLocked(true);
    setWriteupModalOpen(false);
    onSubmitWriteup(writeup);
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
                    if (encounterLocked) return; // prevent switching after lock
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
                    Encounter locked (write‑up submitted).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold">
              Clinical Interview Simulator
            </h1>
            <p className="text-sm text-gray-400">
              {encounterLocked
                ? "Encounter closed — read-only transcript."
                : "Interview the patient, then submit your write‑up."}
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

        <div className="flex-1 overflow-y-auto px-6">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
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
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-gray-700 px-6 py-4 bg-gray-800">
          <div className="max-w-3xl mx-auto">
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
                  disabled={
                    loading || encounterLocked || !inputValue.trim()
                  }
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
        onSubmit={handleWriteupSubmit}
      />
    </div>
  );
};

export default ChatInterface;
