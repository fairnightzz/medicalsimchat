// hooks/useRealtimePatient.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PatientProfile } from "@/types/patient";
import { buildPatientSystemPrompt, isOpenEnded } from "@/lib/buildPatientSystemPrompt";

/* ---------- Types ---------- */

export interface TranscriptEntry {
  role: "user" | "patient";
  text: string;
  timestamp: number;
  final: boolean;
}

interface UseRealtimePatientReturn {
  /* connection state */
  starting: boolean;
  connected: boolean;
  error: string | null;
  mediaSupported: boolean;

  /* transcript */
  userTranscript: TranscriptEntry[];
  patientTranscript: TranscriptEntry[];
  livePartialUser: string;
  livePartialPatient: string;

  /* patient / prompt state */
  chapterIndex: number;
  profile: PatientProfile | null;

  /* control */
  startSession: (profile: PatientProfile, initialChapterIndex?: number) => Promise<void>;
  stopSession: () => void;
  finalizeEncounter: () => void;

  /* prompt management */
  incrementChapterManually: () => void;
  forcePromptRefresh: () => void;

  /* lifecycle */
  encounterEnded: boolean;
}

/* ---------- Hook ---------- */

export function useRealtimePatient(): UseRealtimePatientReturn {
  /* core state */
  const [starting, setStarting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [encounterEnded, setEncounterEnded] = useState(false);

  /* patient + prompt */
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);

  /* transcript state */
  const [userTranscript, setUserTranscript] = useState<TranscriptEntry[]>([]);
  const [patientTranscript, setPatientTranscript] = useState<TranscriptEntry[]>([]);
  const [livePartialUser, setLivePartialUser] = useState("");
  const [livePartialPatient, setLivePartialPatient] = useState("");

  /* refs to objects that persist across renders */
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Keep “live” access to chapterIndex & profile inside callbacks
  const chapterIndexRef = useRef(0);
  const profileRef = useRef<PatientProfile | null>(null);

  const mediaSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices;

  /* ---------- Cleanup ---------- */

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
    stopSession();
    setEncounterEnded(true);
  }, [stopSession]);

  /* ---------- Prompt Send Helper ---------- */

  const sendFullPrompt = useCallback(() => {
    const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe"; // adjust if needed
    const p = profileRef.current;
    const dc = dcRef.current;
    if (!p || !dc || dc.readyState !== "open") return;
    const prompt = buildPatientSystemPrompt(p, chapterIndexRef.current);

    dc.send(JSON.stringify({
      type: "session.update",
      session: {
        instructions: prompt,
        modalities: ["audio", "text"],
        input_audio_transcription: {
          model: TRANSCRIPTION_MODEL,
        }
      }
    }));
  }, []);

  /* ---------- Manual prompt controls exposed ---------- */

  const incrementChapterManually = useCallback(() => {
    chapterIndexRef.current += 1;
    setChapterIndex(chapterIndexRef.current);
    sendFullPrompt();
  }, [sendFullPrompt]);

  const forcePromptRefresh = useCallback(() => {
    sendFullPrompt();
  }, [sendFullPrompt]);

  /* ---------- Data Channel Message Handler ---------- */

  const handleDataMessage = useCallback((ev: MessageEvent) => {
    let data: any;
    try { data = JSON.parse(ev.data); } catch { return; }

    console.debug("RT evt:", data.type, data);
    console.log("RT evt:", data.type, data);

    switch (data.type) {

      /* ================= USER INPUT (your speech) ================= */

      // case "conversation.item.input_audio_transcription.delta": {
      //   const partial = data.delta || "";
      //   setLivePartialUser(partial);
      //   break;
      // }

      case "conversation.item.input_audio_transcription.completed": {
        const full = data.transcript?.trim();
        if (full) {
          setUserTranscript(prev => [
            ...prev,
            { role: "user", text: full, timestamp: Date.now(), final: true }
          ]);
          setLivePartialUser("");

          // Open-ended detection triggers chapter advance
          if (isOpenEnded(full)) {
            chapterIndexRef.current += 1;
            setChapterIndex(chapterIndexRef.current);
            sendFullPrompt();
          }
        }
        break;
      }

      /* ================= ASSISTANT OUTPUT (model speech) ================= */

      // case "response.audio_transcript.delta": {
      //   const partial = data.delta || "";
      //   setLivePartialPatient(partial);
      //   break;
      // }

      case "response.audio_transcript.done": {
        const full = (data.transcript || "").trim();
        if (full) {
          setPatientTranscript(prev => [
            ...prev,
            { role: "patient", text: full, timestamp: Date.now(), final: true }
          ]);
        }
        setLivePartialPatient("");
        break;
      }

      /* ===== Optional consolidated item events ===== */

      case "conversation.item.completed": {
        // In some versions, assistant final text may appear here instead / as well
        const item = data.item;
        if (item?.role === "assistant" || item?.role === "assistant_response") {
          const textBlock = (item.content || []).find((c: any) => c.type === "output_text");
          if (textBlock?.text) {
            setPatientTranscript(prev => [
              ...prev,
              { role: "patient", text: textBlock.text, timestamp: Date.now(), final: true }
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

      /* ===== (Legacy / custom events you originally handled) ===== */
      case "transcript":   // keep only if your backend still sends these
      case "partial":
        // (You can remove these if no longer used)
        break;

      default:
        break;
    }
  }, [sendFullPrompt]);

  /* ---------- Start Session ---------- */

  const startSession = useCallback(
    async (patientProfile: PatientProfile, initialChapterIndex = 0) => {
      if (starting || connected) return;
      if (!mediaSupported) {
        setError("Media not supported in this browser.");
        return;
      }
      setError(null);
      setStarting(true);
      setEncounterEnded(false);

      try {
        // Reset transcripts
        setUserTranscript([]);
        setPatientTranscript([]);
        setLivePartialUser("");
        setLivePartialPatient("");

        // Store profile + chapter state
        setProfile(patientProfile);
        profileRef.current = patientProfile;
        setChapterIndex(initialChapterIndex);
        chapterIndexRef.current = initialChapterIndex;

        // 1. Get mic stream
        const userStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = userStream;

        // 2. RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // 3. Add mic tracks
        userStream.getAudioTracks().forEach(track =>
          pc.addTrack(track, userStream)
        );

        // 4. Data channel
        const dc = pc.createDataChannel("transcript");
        dcRef.current = dc;
        dc.onmessage = handleDataMessage;
        dc.onopen = () => {
          setConnected(true);
          // 1. Enable modalities & user input transcription  // ADDED
          // dc.send(JSON.stringify({
          //   type: "session.update",
          //   session: {
          //     modalities: ["audio", "text"],           // ask for text events in addition to audio
          //     input_audio_transcription: { enabled: true } // request user STT events
          //   }
          // }));
          // Send initial full prompt (chapterIndexRef.current)
          sendFullPrompt();
        };
        dc.onerror = e => {
          console.error("Data channel error", e);
          setError("Data channel error");
        };

        // 5. Remote audio
        pc.ontrack = evt => {
          // Attach first stream to an audio element
          if (!remoteAudioRef.current) {
            const audio = document.createElement("audio");
            audio.autoplay = true;
            audio.setAttribute("playsinline", "");        // iOS hint (harmless elsewhere)
            audio.setAttribute("webkit-playsinline", ""); // legacy iOS webkit hint
            remoteAudioRef.current = audio;
            document.body.appendChild(audio);
          }
          remoteAudioRef.current.srcObject = evt.streams[0];
        };

        // 6. Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 7. Exchange SDP with backend (no large prompt here!)
        const resp = await fetch("/api/realtimeSession", {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            Authorization: "", // not needed client side; backend injects key
          },
          body: offer.sdp || "",
        });

        if (!resp.ok) {
          const detail = await resp.text();
          throw new Error(
            `Realtime session init failed: ${resp.status} ${detail}`
          );
        }
        const answerSDP = await resp.text();

        // 8. Set remote description
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answerSDP,
        });
      } catch (e: any) {
        console.error("startSession error:", e);
        setError(e.message || "Failed to start realtime session");
        cleanup();
      } finally {
        setStarting(false);
      }
    },
    [starting, connected, mediaSupported, handleDataMessage, cleanup, sendFullPrompt]
  );

  /* ---------- Cleanup on unmount ---------- */
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    starting,
    connected,
    error,
    mediaSupported,

    userTranscript,
    patientTranscript,
    livePartialUser,
    livePartialPatient,

    chapterIndex,
    profile,

    startSession,
    stopSession,
    finalizeEncounter,

    incrementChapterManually,
    forcePromptRefresh: forcePromptRefresh,

    encounterEnded,
  };
}
