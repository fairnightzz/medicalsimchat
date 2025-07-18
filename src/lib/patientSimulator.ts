/**
 * Patient Simulator Module
 *
 * Loads patient profiles (new standard) from JSON
 * Generates AI responses (via /api/chat)
 * Provides diagnosis evaluation helpers
 */

import patientsData from "@/data/patients.json"; // ← Type asserted below
import { PatientProfile } from "@/types/patient";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* -------- Data Loading -------- */

// Because JSON import is 'any', cast & (optionally) validate here.
// For production you could integrate Zod schema validation.
const patientProfiles: PatientProfile[] = patientsData as PatientProfile[];

if (!Array.isArray(patientProfiles) || patientProfiles.length === 0) {
  // Fail fast to surface misconfiguration during build.
  // eslint-disable-next-line no-console
  console.warn("[patientSimulator] No patient profiles loaded from patients.json");
}

/* -------- Accessors -------- */

export function loadRandomPatientProfile(): PatientProfile {
  if (!patientProfiles.length) {
    throw new Error("No patient profiles available.");
  }
  const randomIndex = Math.floor(Math.random() * patientProfiles.length);
  return patientProfiles[randomIndex];
}

export function loadPatientProfileById(id: string): PatientProfile | null {
  return patientProfiles.find(p => p.id === id) || null;
}

export function getAllPatientProfiles(): PatientProfile[] {
  return [...patientProfiles];
}

/* -------- Diagnosis Evaluation -------- */

export function evaluateDiagnosis(
  diagnosis: string,
  actualCondition: string
): boolean {
  const norm = (s: string) => s.toLowerCase().trim();
  return (
    norm(diagnosis).includes(norm(actualCondition)) ||
    norm(actualCondition).includes(norm(diagnosis))
  );
}

/**
 * Pick the correct label for evaluation:
 * - Prefer explicit trueCondition if provided
 * - Else fall back to chiefComplaintSummary
 */
export function getEvaluationTarget(profile: PatientProfile): string {
  return profile.chiefComplaintSummary;
}

/* -------- OpenAI Response Generation -------- */

export async function generatePatientResponse(
  messages: Message[],
  patientProfile: PatientProfile,
  chapterIndex: number
): Promise<{ reply: string; nextChapterIndex: number; openEnded: boolean }> {
  try {
    const conversation = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation, patientProfile, chapterIndex })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return {
      reply: data.response,
      nextChapterIndex: data.nextChapterIndex,
      openEnded: data.openEnded
    };
  } catch (e) {
    console.error("Simulation error:", e);
    return {
      reply: "Sorry, something went wrong.",
      nextChapterIndex: chapterIndex,
      openEnded: false
    };
  }
}

/* -------- Utility Helpers -------- */

export function createMessage(
  role: "user" | "assistant",
  content: string
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: new Date()
  };
}

export function formatDiagnosisResult(
  userDiagnosis: string,
  actualCondition: string,
  explanation: string,
  isCorrect: boolean
): string {
  const emoji = isCorrect ? "✅" : "❌";
  return `${emoji} ${isCorrect ? "Correct diagnosis!" : "Incorrect diagnosis."}\n\nActual condition: ${actualCondition}\n\n${explanation}`;
}
