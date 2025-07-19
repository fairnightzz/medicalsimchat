// hooks/usePatientSimulation.ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  loadRandomPatientProfile,
  getAllPatientProfiles,
  createMessage,
  generatePatientResponse,
  Message,
} from "@/lib/patientSimulator";
import { PatientProfile } from "@/types/patient";
import { StructuredWriteup, structuredWriteupToMarkdown } from "@/lib/structuredWriteupToMarkdown";

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
  raw?: any;
}

const emptyWriteup: StructuredWriteup = {
  ageGender: "",
  chiefComplaint: "",
  hpi: "",
  pmh: "",
  immunizations: "",
  pastSurgical: "",
  medications: "",
  medicationAllergies: "",
  familyHistory: "",
  socialHistory: "",
  sexualHistory: "",
  ros: "",
};



export function usePatientSimulation(options: UsePatientSimulationOptions = {}) {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [writeupModalOpen, setWriteupModalOpen] = useState(false);
  const [encounterLocked, setEncounterLocked] = useState(false);

  const [structuredWriteup, setStructuredWriteup] =
    useState<StructuredWriteup | null>(null);
  const [writeupMarkdown, setWriteupMarkdown] = useState<string | null>(null);

  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ---- Initial load ----
  useEffect(() => {
    let profile: PatientProfile | null = null;
    if (options.initialPatientId) {
      profile =
        getAllPatientProfiles().find(p => p.id === options.initialPatientId) ||
        null;
    }
    if (!profile) profile = loadRandomPatientProfile();
    resetProfile(profile);
  }, [options.initialPatientId]);

  const resetProfile = useCallback((profile: PatientProfile) => {
    setPatient(profile);
    setMessages([
      createMessage("assistant", profile.openingStatement || "Hi doctor."),
    ]);
    setChapterIndex(0);
    setEncounterLocked(false);
    setStructuredWriteup(null);
    setWriteupMarkdown(null);
    setGradingResult(null);
    setGradingError(null);
  }, []);

  // ---- Patient switching ----
  const newRandomPatient = useCallback(() => {
    if (encounterLocked) return;
    resetProfile(loadRandomPatientProfile());
  }, [encounterLocked, resetProfile]);

  const selectPatient = useCallback(
    (id: string) => {
      if (encounterLocked) return;
      const profile = getAllPatientProfiles().find(p => p.id === id);
      if (profile) resetProfile(profile);
    },
    [encounterLocked, resetProfile]
  );

  // ---- Sending user messages ----
  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!patient || encounterLocked) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg = createMessage("user", trimmed);
      setMessages(prev => [...prev, userMsg]);
      setLoading(true);
      try {
        const transcript = [...messagesRef.current, userMsg];
        const { reply, nextChapterIndex } = await generatePatientResponse(
          transcript,
          patient,
          chapterIndex
        );
        setMessages(prev => [...prev, createMessage("assistant", reply)]);
        setChapterIndex(nextChapterIndex);
      } catch {
        setMessages(prev => [
          ...prev,
          createMessage(
            "assistant",
            "Sorry, something went wrong. Could we try that again?"
          ),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [patient, encounterLocked, chapterIndex]
  );

  // ---- Submit structured write-up ----
  /**
   * Accepts the raw concatenated markdown OR (recommended) the already structured
   * object from the modal. We'll modify modal to pass an object.
   */
  const submitWriteup = useCallback(
    async (markdownOrStructured: string | StructuredWriteup) => {
      if (!patient || encounterLocked) return;

      let structured: StructuredWriteup;
      if (typeof markdownOrStructured === "string") {
        // backwards compatibility if you keep a plain markdown
        structured = { ...emptyWriteup, hpi: markdownOrStructured };
      } else {
        structured = markdownOrStructured;
      }

      const markdown = structuredWriteupToMarkdown(structured);

      setStructuredWriteup(structured);
      setWriteupMarkdown(markdown);
      setEncounterLocked(true);
      setGradingLoading(true);
      setGradingError(null);

      // snapshot transcript (conversation only)
      const transcriptSnapshot = messagesRef.current.map(m => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            writeup: markdown,
            transcript: transcriptSnapshot,
            patientProfile: patient,
            finalChapterIndex: chapterIndex,
          }),
        });
        if (!res.ok) throw new Error(`Grading API error: ${res.status}`);

        const { grading } = await res.json();
        const result: GradingResult = {
          conversationScore: grading.conversationScore ?? 0,
          writeupScore: grading.writeupCoverageScore ?? 0,
          overallScore: grading.overallScore ?? 0,
          strengths: grading.strengths || [],
          improvements: grading.improvements || [],
          missedConcepts: grading.missedElements || [],
          hallucinatedConcepts: grading.hallucinations || [],
          raw: grading,
        };
        setGradingResult(result);
      } catch (err: any) {
        setGradingError(err?.message || "Grading failed.");
      } finally {
        setGradingLoading(false);
      }
    },
    [patient, encounterLocked, chapterIndex]
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
    structuredWriteup,
    writeupMarkdown,
    gradingLoading,
    gradingResult,
    gradingError,
    actions: {
      sendUserMessage,
      newRandomPatient,
      selectPatient,
      submitWriteup,
      setEncounterLocked, // if needed externally
    },
  };
}
