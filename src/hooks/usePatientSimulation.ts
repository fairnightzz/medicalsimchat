// hooks/usePatientSimulation.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  loadRandomPatientProfile,
  getAllPatientProfiles,
  createMessage,
  generatePatientResponse,
  Message,
} from "@/lib/patientSimulator";
import { PatientProfile } from "@/types/patient";

interface UsePatientSimulationOptions {
  initialPatientId?: string;
}

interface GradingResult {
  conversationScore: number;
  writeupScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missedConcepts: string[];
  hallucinatedConcepts: string[];
  raw?: any; // optional debug payload
}

export function usePatientSimulation(options: UsePatientSimulationOptions = {}) {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [writeupModalOpen, setWriteupModalOpen] = useState(false);
  const [encounterLocked, setEncounterLocked] = useState(false);

  const [writeup, setWriteup] = useState<string | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // INITIAL PATIENT LOAD
  useEffect(() => {
    let profile: PatientProfile | null = null;
    if (options.initialPatientId) {
      profile =
        getAllPatientProfiles().find((p) => p.id === options.initialPatientId) ||
        null;
    }
    if (!profile) profile = loadRandomPatientProfile();
    setPatient(profile);
    if (profile) {
      setMessages([
        createMessage("assistant", profile.openingStatement || "Hi doctor."),
      ]);
      setChapterIndex(0);
      setEncounterLocked(false);
      setWriteup(null);
      setGradingResult(null);
      setGradingError(null);
    }
  }, [options.initialPatientId]);

  // LOAD NEW RANDOM PATIENT
  const newRandomPatient = useCallback(() => {
    const profile = loadRandomPatientProfile();
    setPatient(profile);
    setMessages([
      createMessage("assistant", profile.openingStatement || "Hi doctor."),
    ]);
    setChapterIndex(0);
    setEncounterLocked(false);
    setWriteup(null);
    setGradingResult(null);
    setGradingError(null);
  }, []);

  // SELECT SPECIFIC PATIENT
  const selectPatient = useCallback((id: string) => {
    const profile = getAllPatientProfiles().find((p) => p.id === id);
    if (!profile) return;
    setPatient(profile);
    setMessages([
      createMessage("assistant", profile.openingStatement || "Hi doctor."),
    ]);
    setChapterIndex(0);
    setEncounterLocked(false);
    setWriteup(null);
    setGradingResult(null);
    setGradingError(null);
  }, []);

  // SEND USER MESSAGE (if not locked)
  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!patient) return;
      if (!text.trim()) return;
      if (encounterLocked) return;

      const userMsg = createMessage("user", text.trim());
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      try {
        const { reply, nextChapterIndex } = await generatePatientResponse(
          [...messages, userMsg],
          patient,
          chapterIndex
        );
        const assistantMsg = createMessage("assistant", reply);
        setMessages((prev) => [...prev, assistantMsg]);
        setChapterIndex(nextChapterIndex);
      } catch (e) {
        const fallback = createMessage(
          "assistant",
          "Sorry, something went wrong. Could we try that again?"
        );
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setLoading(false);
      }
    },
    [patient, messages, chapterIndex, encounterLocked]
  );

  const submitWriteup = useCallback(
    async (writeupText: string) => {
      if (!patient || encounterLocked) return;
      setWriteup(writeupText);
      setEncounterLocked(true);
      setGradingLoading(true);
      setGradingError(null);

      try {
        // 1. Add the write-up as an assistant "Write-Up Submitted" message
        const writeupMsg = createMessage(
          "assistant",
          `**Learner Write-Up Submitted**\n\n${writeupText}`
        );
        setMessages(prev => [...prev, writeupMsg]);

        // 2. Call grading endpoint
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writeup: writeupText,
            transcript: messages.map(m => ({ role: m.role, content: m.content })),
            patientProfile: patient,
            finalChapterIndex: chapterIndex
          })
        });

        if (!res.ok) {
          throw new Error(`Grading API error: ${res.status}`);
        }

        const { grading } = await res.json();

        const result: GradingResult = {
          conversationScore: grading.conversationScore ?? 0,
          writeupScore: grading.writeupCoverageScore ?? 0,
          overallScore: grading.overallScore ?? 0,
          strengths: grading.strengths || [],
          improvements: grading.improvements || [],
          missedConcepts: grading.missedElements || [],
          hallucinatedConcepts: grading.hallucinations || [],
          raw: grading
        };

        setGradingResult(result);

        // 3. Add feedback as assistant message
        const feedbackLines: string[] = [];
        feedbackLines.push(`**Feedback Summary**`);
        feedbackLines.push(
          `Scores — Conversation: ${result.conversationScore}/100 | Write-Up: ${result.writeupScore}/100 | Overall: ${result.overallScore}/100`
        );
        if (result.strengths.length) {
          feedbackLines.push(
            `**Strengths:** ${result.strengths.map(s => `• ${s}`).join(" ")}`
          );
        }
        if (result.improvements.length) {
          feedbackLines.push(
            `**Improvements:** ${result.improvements.map(i => `• ${i}`).join(" ")}`
          );
        }
        if (result.missedConcepts.length) {
          feedbackLines.push(
            `**Missed Elements:** ${result.missedConcepts.join(", ")}`
          );
        }
        if (result.hallucinatedConcepts.length) {
          feedbackLines.push(
            `**Unsubstantiated / Hallucinated:** ${result.hallucinatedConcepts.join(", ")}`
          );
        }

        const feedbackMsg = createMessage("assistant", feedbackLines.join("\n\n"));
        setMessages(prev => [...prev, feedbackMsg]);

      } catch (err: any) {
        setGradingError(err?.message || "Grading failed.");
        const errorMsg = createMessage(
          "assistant",
          "⚠️ Grading failed. Please retry later."
        );
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setGradingLoading(false);
      }
    },
    [patient, encounterLocked, messages, chapterIndex]
  );

  const allProfiles = getAllPatientProfiles();

  const patientSummary = patient
    ? {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      openingStatement: patient.openingStatement,
      chiefComplaintSummary: patient.chiefComplaintSummary,
      currentSymptomStatus: patient.currentSymptomStatus,
      affect: patient.affectDescription,
      mannerisms: patient.mannerisms || [],
      chaptersTotal: patient.narrativeChapters.length,
      chaptersRevealed: chapterIndex,
    }
    : null;

  return {
    patient,
    patientSummary,
    allProfiles,
    messages,
    loading,
    chapterIndex,
    writeupModalOpen,
    setWriteupModalOpen,
    encounterLocked,
    writeup,
    gradingLoading,
    gradingResult,
    gradingError,
    actions: {
      sendUserMessage,
      newRandomPatient,
      selectPatient,
      submitWriteup,
    },
  };
}
