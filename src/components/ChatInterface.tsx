"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Send, Menu, User, RefreshCw, X } from "lucide-react";
import ConversationHistory from "./ConversationHistory";
import DiagnosisModal from "./DiagnosisModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PatientProfile {
  id: string;
  condition: string;
  symptoms: string[];
  personality: string;
  history: string;
  explanation: string;
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => Promise<string>;
  patientProfile?: PatientProfile;
  onNewPatient?: () => void;
  onSelectPatient?: (patientId: string) => void;
}

const ChatInterface = ({
  onSendMessage = async (message) => {
    // Default mock response if no handler is provided
    return "I'm not feeling well today. Can you help me, doctor?";
  },
  patientProfile = {
    id: "default",
    condition: "Common Cold",
    symptoms: ["Runny nose", "Sore throat", "Mild fever", "Cough"],
    personality: "Slightly anxious but cooperative",
    history: "Has been feeling unwell for 3 days",
    explanation:
      "The common cold is a viral infection of the upper respiratory tract.",
  },
  onNewPatient,
  onSelectPatient,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello doctor, I'm not feeling well today. Can you help me?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState(patientProfile.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Import patient profiles from the simulator
  const { getAllPatientProfiles } = require("@/lib/patientSimulator");
  const mockPatientProfiles = getAllPatientProfiles().map((profile) => ({
    id: profile.id,
    condition: profile.condition,
    symptoms: profile.symptoms,
    personalityTraits: profile.personalityTraits,
    history: profile.medicalHistory,
  }));

  // Use the patient profile passed from parent, or fall back to default
  const currentProfile = {
    id: patientProfile.id,
    condition: patientProfile.condition,
    symptoms: patientProfile.symptoms,
    personalityTraits:
      typeof patientProfile.personality === "string"
        ? patientProfile.personality.split(", ")
        : [patientProfile.personality],
    history: patientProfile.history,
  };

  // Update selected profile ID when patient profile changes
  useEffect(() => {
    setSelectedProfileId(patientProfile.id);
  }, [patientProfile.id]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to AI and get response
      console.log("trying to send message");
      const response = await onSendMessage(inputValue);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting response:", error);

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content:
          "I'm sorry LOL, I'm not feeling well enough to respond right now. Can we try again?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitDiagnosis = (diagnosis: string, notes: string) => {
    // Import evaluation functions from the simulator
    const {
      evaluateDiagnosis,
      formatDiagnosisResult,
    } = require("@/lib/patientSimulator");

    // Close the modal after submission
    setIsDiagnosisModalOpen(false);

    // Add the diagnosis to the chat as a user message
    const diagnosisMessage: Message = {
      role: "user",
      content: `My diagnosis: ${diagnosis}\n${notes ? `Notes: ${notes}` : ""}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, diagnosisMessage]);

    // Evaluate the diagnosis using the simulator function
    const isCorrect = evaluateDiagnosis(diagnosis, patientProfile.condition);

    // Format the result using the simulator function
    const resultContent = formatDiagnosisResult(
      diagnosis,
      patientProfile.condition,
      patientProfile.explanation,
      isCorrect,
    );

    const systemResponse: Message = {
      role: "assistant",
      content: resultContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, systemResponse]);
  };

  const handleNewPatient = () => {
    // Reset the chat messages
    setMessages([
      {
        role: "assistant",
        content: "Hello doctor, I'm not feeling well today. Can you help me?",
        timestamp: new Date(),
      },
    ]);

    // Clear input
    setInputValue("");

    // Call the parent's new patient handler if provided
    if (onNewPatient) {
      onNewPatient();
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Side Menu */}
      <div
        className={`h-full bg-gray-800 transform transition-all duration-300 ease-in-out flex-shrink-0 border-r border-gray-700 ${
          sideMenuOpen ? "w-80" : "w-16"
        } overflow-hidden`}
      >
        <div className={`${sideMenuOpen ? "w-80" : "w-16"} h-full`}>
          <div className="flex items-center justify-between p-6">
            {sideMenuOpen ? (
              <>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Profile
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
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Select
                  value={selectedProfileId}
                  onValueChange={(value) => {
                    setSelectedProfileId(value);
                    // Reset the chat messages when selecting a new patient
                    setMessages([
                      {
                        role: "assistant",
                        content:
                          "Hello doctor, I'm not feeling well today. Can you help me?",
                        timestamp: new Date(),
                      },
                    ]);
                    // Clear input
                    setInputValue("");
                    if (onSelectPatient) {
                      onSelectPatient(value);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select patient profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatientProfiles.map((profile) => (
                      <SelectItem
                        key={profile.id}
                        value={profile.id.toString()}
                      >
                        {profile.condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewPatient}
                  className="flex items-center gap-2 bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  New
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">
                    {currentProfile.condition}
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    {currentProfile.history}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-white">Symptoms:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {currentProfile.symptoms.map((symptom, index) => (
                      <li key={index} className="text-gray-300">
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-white">
                    Personality Traits:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.personalityTraits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 rounded-md text-xs text-gray-200"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-gray-400">
                    Patient ID: {currentProfile.id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Medical Diagnosis Simulator
            </h1>
            <p className="text-sm text-gray-400">
              Practice your diagnostic skills with simulated patients
            </p>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6">
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white ml-12"
                        : "bg-gray-700 text-gray-100 mr-12"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
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
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-700 px-6 py-4 bg-gray-800">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message the patient..."
                    disabled={isLoading}
                    className="pr-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-xl h-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || inputValue.trim() === ""}
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => setIsDiagnosisModalOpen(true)}
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                >
                  Submit Diagnosis
                </Button>
              </div>
              {isLoading && (
                <div className="text-sm text-gray-400 mt-3 text-center">
                  Patient is thinking...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        onSubmit={handleSubmitDiagnosis}
      />
    </div>
  );
};

export default ChatInterface;
