"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadRandomPatientProfile,
  getAllPatientProfiles,
} from "@/lib/patientSimulator"; // adjust import path if needed
import { PatientProfile } from "@/types/patient";
import { buildPatientSystemPrompt, isOpenEnded } from "@/lib/buildPatientSystemPrompt";
import { structuredWriteupToMarkdown } from "@/lib/structuredWriteupToMarkdown";
import type { StructuredWriteup } from "@/lib/structuredWriteupToMarkdown";

/* ---------- Shared Grading Types (reuse shape) ---------- */
export interface GradingResult {
  conversationScore: number;
  writeupScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missedConcepts: string[];
  hallucinatedConcepts: string[];
  raw?: any;
}

/* ---------- Internal Message + Transcript Types ---------- */
export interface RealtimeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  partial?: boolean;
}

interface TranscriptEntry {
  role: "user" | "patient";
  text: string;
  timestamp: number;
  final: boolean;
}

/* ---------- Hook Return Shape ---------- */
interface UseRealtimePatientReturn {
  /* patient + chapter */
  patient: PatientProfile | null;
  patientSummary: {
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
  } | null;
  allProfiles: PatientProfile[];
  chapterIndex: number;

  /* connection */
  starting: boolean;
  connected: boolean;
  error: string | null;
  mediaSupported: boolean;
  encounterEnded: boolean;

  /* transcript (high-level merged & raw) */
  messages: RealtimeMessage[];                // merged chronological (final only)
  userTranscript: TranscriptEntry[];
  patientTranscript: TranscriptEntry[];
  livePartialUser: string;
  livePartialPatient: string;

  /* write-up + grading */
  writeupModalOpen: boolean;
  setWriteupModalOpen: (b: boolean) => void;
  encounterLocked: boolean;
  structuredWriteup: StructuredWriteup | null;
  writeupMarkdown: string | null;
  gradingLoading: boolean;
  gradingResult: GradingResult | null;
  gradingError: string | null;

  /* actions */
  actions: {
    startSession: (profile?: PatientProfile, initialChapterIndex?: number) => Promise<void>;
    stopSession: () => void;
    finalizeEncounter: () => void;

    newRandomPatient: () => void;
    selectPatient: (id: string) => void;

    incrementChapterManually: () => void;
    forcePromptRefresh: () => void;

    submitWriteup: (w: StructuredWriteup) => Promise<void>;

    /* Optional future manual text injection for debugging */
    addManualUserMessage: (text: string) => void;
  };
}

/* ---------- Hook Implementation ---------- */
export function useRealtimePatient(): UseRealtimePatientReturn {

  /* ===== Core State ===== */
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);

  /* Connection */
  const [starting, setStarting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [encounterEnded, setEncounterEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Transcript primitives */
  const [userTranscript, setUserTranscript] = useState<TranscriptEntry[]>([]);
  const [patientTranscript, setPatientTranscript] = useState<TranscriptEntry[]>([]);
  const [livePartialUser, setLivePartialUser] = useState("");
  const [livePartialPatient, setLivePartialPatient] = useState("");

  /* Merged final message log (mirrors text mode) */
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);

  /* Write-up / grading */
  const [writeupModalOpen, setWriteupModalOpen] = useState(false);
  const [encounterLocked, setEncounterLocked] = useState(false);
  const [structuredWriteup, setStructuredWriteup] = useState<StructuredWriteup | null>(null);
  const [writeupMarkdown, setWriteupMarkdown] = useState<string | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [gradingError, setGradingError] = useState<string | null>(null);

  /* Refs */
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const profileRef = useRef<PatientProfile | null>(null);
  const chapterIndexRef = useRef(0);

  const mediaSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  /* ===== Patient Init / Switching ===== */
  const allProfiles = useMemo(() => getAllPatientProfiles(), []);
  const loadInitialPatient = useCallback(() => {
    const p = loadRandomPatientProfile();
    setPatient(p);
    profileRef.current = p;
    setChapterIndex(0);
    chapterIndexRef.current = 0;
  }, []);
  useEffect(() => {
    loadInitialPatient();
  }, [loadInitialPatient]);

  const resetForPatient = useCallback((p: PatientProfile) => {
    // Core patient + chapter
    setPatient(p);
    profileRef.current = p;
    setChapterIndex(0);
    chapterIndexRef.current = 0;

    // Conversation / transcripts
    setUserTranscript([]);
    setPatientTranscript([]);
    setLivePartialUser("");
    setLivePartialPatient("");
    setMessages([]);

    // Encounter lifecycle
    setEncounterEnded(false);
    setEncounterLocked(false);
    setStarting(false);
    setConnected(false); // (only relevant if you allow reset mid-connection; keep or remove)

    // Write-up + grading
    setStructuredWriteup(null);
    setWriteupMarkdown(null);
    setGradingResult(null);
    setGradingError(null);
    setWriteupModalOpen(false);
  }, []);


  const newRandomPatient = useCallback(() => {
    if (connected) return;
    const p = loadRandomPatientProfile();
    resetForPatient(p);
  }, [connected]);

  const selectPatient = useCallback((id: string) => {
    if (connected) return;
    const p = allProfiles.find(pr => pr.id === id);
    if (p) {
      resetForPatient(p);
    }
  }, [allProfiles, connected]);

  /* ===== Prompt Update ===== */
  const sendFullPrompt = useCallback(() => {
    const p = profileRef.current;
    const dc = dcRef.current;
    if (!p || !dc || dc.readyState !== "open") return;
    const instructions = buildPatientSystemPrompt(p, chapterIndexRef.current);
    dc.send(JSON.stringify({
      type: "session.update",
      session: {
        instructions,
        modalities: ["audio", "text"],
        input_audio_transcription: { model: "gpt-4o-mini-transcribe" }
      }
    }));
  }, []);

  const incrementChapterManually = useCallback(() => {
    chapterIndexRef.current += 1;
    setChapterIndex(chapterIndexRef.current);
    sendFullPrompt();
  }, [sendFullPrompt]);

  const forcePromptRefresh = useCallback(() => {
    sendFullPrompt();
  }, [sendFullPrompt]);

  /* ===== Connection Cleanup ===== */
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setConnected(false);
  }, []);

  const stopSession = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const finalizeEncounter = useCallback(() => {
    // End session & open writeup modal
    stopSession();
    setEncounterEnded(true);
    setWriteupModalOpen(true);
  }, [stopSession]);

  /* ===== Merge transcripts into messages whenever finals change ===== */
  useEffect(() => {
    const merged = [
      ...userTranscript.map(t => ({
        id: `u-${t.timestamp}`,
        role: "user" as const,
        content: t.text,
        timestamp: new Date(t.timestamp),
        partial: !t.final
      })),
      ...patientTranscript.map(t => ({
        id: `p-${t.timestamp}`,
        role: "assistant" as const,
        content: t.text,
        timestamp: new Date(t.timestamp),
        partial: !t.final
      }))
    ]
      .filter(m => m.content.trim())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setMessages(merged);
  }, [userTranscript, patientTranscript]);

  /* ===== Data Channel Event Handling ===== */
  const handleDataMessage = useCallback((ev: MessageEvent) => {
    let data: any;
    try { data = JSON.parse(ev.data); } catch { return; }

    switch (data.type) {

      /* User (input) transcription streaming */
      // case "conversation.item.input_audio_transcription.delta": {
      //   setLivePartialUser(data.delta || "");
      //   break;
      // }
      case "conversation.item.input_audio_transcription.completed": {
        const full = (data.transcript || "").trim();
        if (full) {
          setUserTranscript(prev => [
            ...prev,
            { role: "user", text: full, timestamp: Date.now(), final: true }
          ]);
          setLivePartialUser("");

          if (isOpenEnded(full)) {
            chapterIndexRef.current += 1;
            setChapterIndex(chapterIndexRef.current);
            sendFullPrompt();
          }
        }
        break;
      }

      /* Assistant (output) transcription streaming */
      // case "response.audio_transcript.delta": {
      //   setLivePartialPatient(data.delta || "");
      //   break;
      // }
      case "response.audio_transcript.done": {
        const full = (data.transcript || "").trim();
        if (full) {
          setPatientTranscript(prev => [
            ...prev,
            { role: "patient", text: full, timestamp: Date.now(), final: true }
          ]);
          setLivePartialPatient("");
        }
        break;
      }

      /* Fallback consolidated item event (optional) */
      case "conversation.item.completed": {
        const item = data.item;
        if (item?.role === "assistant" && Array.isArray(item.content)) {
          const textBlock = item.content.find((c: any) => c.type === "output_text");
          if (textBlock?.text?.trim()) {
            setPatientTranscript(prev => [
              ...prev,
              { role: "patient", text: textBlock.text.trim(), timestamp: Date.now(), final: true }
            ]);
            setLivePartialPatient("");
          }
        }
        break;
      }

      case "error":
      case "session.error":
        setError(data.message || "Realtime error");
        break;

      default:
        break;
    }
  }, [sendFullPrompt]);

  /* ===== Start Session ===== */
  const startSession = useCallback(async (profileOverride?: PatientProfile, initialChapterIndex = 0) => {
    if (starting || connected) return;
    if (!mediaSupported) {
      setError("Media not supported in this browser.");
      return;
    }
    setError(null);
    setStarting(true);
    setEncounterEnded(false);

    try {
      // Reset transcripts & state
      setUserTranscript([]);
      setPatientTranscript([]);
      setLivePartialUser("");
      setLivePartialPatient("");
      setMessages([]);
      setStructuredWriteup(null);
      setWriteupMarkdown(null);
      setGradingResult(null);
      setGradingError(null);
      setEncounterLocked(false);

      // Patient profile
      const activeProfile = profileOverride || patient || loadRandomPatientProfile();
      setPatient(activeProfile);
      profileRef.current = activeProfile;
      chapterIndexRef.current = initialChapterIndex;
      setChapterIndex(initialChapterIndex);

      // Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;

      // PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcRef.current = pc;

      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      // Data channel
      const dc = pc.createDataChannel("transcript");
      dcRef.current = dc;
      dc.onmessage = handleDataMessage;
      dc.onopen = () => {
        setConnected(true);
        sendFullPrompt();
        dc.send(JSON.stringify({ type: "response.create" }));
      };
      dc.onerror = e => {
        console.error("Data channel error", e);
        setError("Data channel error");
      };

      // Remote audio
      pc.ontrack = evt => {
        if (!remoteAudioRef.current) {
          const audio = document.createElement("audio");
          audio.autoplay = true;
          audio.setAttribute("playsinline", "");
          remoteAudioRef.current = audio;
          document.body.appendChild(audio);
        }
        remoteAudioRef.current.srcObject = evt.streams[0];
      };

      // SDP offer/answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const resp = await fetch("/api/realtimeSession", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp || ""
      });
      if (!resp.ok) {
        const detail = await resp.text();
        throw new Error(`Realtime init failed: ${resp.status} ${detail}`);
      }
      const answerSDP = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
    } catch (e: any) {
      console.error("startSession error:", e);
      setError(e.message || "Failed to start realtime session");
      cleanup();
    } finally {
      setStarting(false);
    }
  }, [starting, connected, mediaSupported, patient, handleDataMessage, cleanup, sendFullPrompt]);

  /* ===== Submit Write-Up & Grade ===== */
  const submitWriteup = useCallback(async (w: StructuredWriteup) => {
    if (!patient || encounterLocked) return;

    const markdown = structuredWriteupToMarkdown(w);
    setStructuredWriteup(w);
    setWriteupMarkdown(markdown);
    setEncounterLocked(true);
    setGradingLoading(true);
    setGradingError(null);
    setGradingResult(null);

    // Build chronological transcript from existing final messages
    // (messages already sorted; filter to final only)
    const transcriptPayload = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writeup: markdown,
          transcript: transcriptPayload,
          patientProfile: patient,
          finalChapterIndex: chapterIndex
        })
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
        raw: grading
      };
      setGradingResult(result);
    } catch (e: any) {
      setGradingError(e.message || "Grading failed.");
    } finally {
      setGradingLoading(false);
    }
  }, [patient, encounterLocked, messages, chapterIndex]);

  /* ===== Optional manual message injection (debug) ===== */
  const addManualUserMessage = useCallback((text: string) => {
    setUserTranscript(prev => [
      ...prev,
      { role: "user", text, timestamp: Date.now(), final: true }
    ]);
  }, []);

  /* ===== Patient Summary Derivation ===== */
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
      chaptersRevealed: chapterIndex
    }
    : null;

  /* ===== Cleanup on Unmount ===== */
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    patient,
    patientSummary,
    allProfiles,
    chapterIndex,

    starting,
    connected,
    error,
    mediaSupported,
    encounterEnded,

    messages,
    userTranscript,
    patientTranscript,
    livePartialUser,
    livePartialPatient,

    writeupModalOpen,
    setWriteupModalOpen,
    encounterLocked,
    structuredWriteup,
    writeupMarkdown,
    gradingLoading,
    gradingResult,
    gradingError,

    actions: {
      startSession,
      stopSession,
      finalizeEncounter,
      newRandomPatient,
      selectPatient,
      incrementChapterManually,
      forcePromptRefresh,
      submitWriteup,
      addManualUserMessage
    }
  };
}
