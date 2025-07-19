// hooks/useRealtimePatient.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriptEntry {
  role: "user" | "patient";
  text: string;
  timestamp: number;
  final: boolean;
}

interface UseRealtimePatientReturn {
  starting: boolean;
  connected: boolean;
  error: string | null;

  userTranscript: TranscriptEntry[];
  patientTranscript: TranscriptEntry[];
  livePartialUser: string;
  livePartialPatient: string;

  startSession: (personaPrompt?: string) => Promise<void>;
  stopSession: () => void;
  finalizeEncounter: () => void;

  mediaSupported: boolean;
  encounterEnded: boolean;
}

export function useRealtimePatient(): UseRealtimePatientReturn {
  const [starting, setStarting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [encounterEnded, setEncounterEnded] = useState(false);

  const [userTranscript, setUserTranscript] = useState<TranscriptEntry[]>([]);
  const [patientTranscript, setPatientTranscript] = useState<TranscriptEntry[]>([]);
  const [livePartialUser, setLivePartialUser] = useState("");
  const [livePartialPatient, setLivePartialPatient] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices;

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
    // Immediately stop further audio streaming but keep transcripts for write‑up
    stopSession();
    setEncounterEnded(true);
  }, [stopSession]);

  // Handle inbound messages from data channel
  const handleDataMessage = useCallback((ev: MessageEvent) => {
    try {
      const data = JSON.parse(ev.data);
      // Example expected structures (adjust to your Realtime API):
      // { type: "transcript", role: "user"|"patient", text: "...", final: boolean }
      // { type: "partial", role: "patient", text: "..." }
      if (data.type === "transcript") {
        const entry: TranscriptEntry = {
          role: data.role,
          text: data.text,
          final: !!data.final,
          timestamp: Date.now(),
        };

        if (data.role === "user") {
          setUserTranscript(prev => [...prev, entry]);
          setLivePartialUser("");
        } else {
          setPatientTranscript(prev => [...prev, entry]);
          setLivePartialPatient("");
        }
      } else if (data.type === "partial") {
        if (data.role === "user") setLivePartialUser(data.text);
        else setLivePartialPatient(data.text);
      }
      // You could also handle events like { type: "session_ready" } / errors.
    } catch (e) {
      console.warn("Non‑JSON data channel message", ev.data);
    }
  }, []);

  const startSession = useCallback(
    async (personaPrompt?: string) => {
      if (starting || connected) return;
      if (!mediaSupported) {
        setError("Media not supported in this browser.");
        return;
      }
      setError(null);
      setStarting(true);

      try {
        // 1. Get mic
        const userStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = userStream;

        // 2. Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // 3. Add local audio track
        userStream.getAudioTracks().forEach(track => pc.addTrack(track, userStream));

        // 4. Data channel for transcripts
        const dc = pc.createDataChannel("transcript");
        dcRef.current = dc;
        dc.onmessage = handleDataMessage;
        dc.onopen = () => {
          setConnected(true);
        };
        dc.onerror = (e) => {
          console.error("DataChannel error:", e);
          setError("Data channel error");
        };

        // 5. Remote audio handling
        pc.ontrack = evt => {
          // Create or reuse an <audio> element for patient audio
          if (!remoteAudioRef.current) {
            const audioEl = document.createElement("audio");
            audioEl.autoplay = true;
            // audioEl.playsInline = true;
            audioEl.setAttribute("playsinline", "");
            audioEl.setAttribute("webkit-playsinline", "");
            remoteAudioRef.current = audioEl;
            document.body.appendChild(audioEl); // or manage via React ref
          }
          remoteAudioRef.current.srcObject = evt.streams[0];
        };

        // 6. Create SDP offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 7. Send offer to our Next.js API to get answer
        const resp = await fetch("/api/realtimeSession", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offer: offer.sdp,
            personaPrompt: personaPrompt || undefined,
          }),
        });
        if (!resp.ok) {
          throw new Error(`Realtime session init failed: ${resp.status}`);
        }
        const { answer, error: apiError } = await resp.json();
        if (apiError) {
          throw new Error(apiError);
        }
        if (!answer) {
          throw new Error("No SDP answer returned.");
        }

        // 8. Set remote description
        const answerDesc = { type: "answer" as const, sdp: answer };
        await pc.setRemoteDescription(answerDesc);

        setConnected(true);
      } catch (e: any) {
        console.error("startSession error:", e);
        setError(e.message || "Failed to start realtime session");
        cleanup();
      } finally {
        setStarting(false);
      }
    },
    [starting, connected, mediaSupported, handleDataMessage, cleanup]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    starting,
    connected,
    error,
    userTranscript,
    patientTranscript,
    livePartialUser,
    livePartialPatient,
    startSession,
    stopSession,
    finalizeEncounter,
    mediaSupported,
    encounterEnded,
  };
}
