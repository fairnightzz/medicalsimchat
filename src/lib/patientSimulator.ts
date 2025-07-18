/**
 * Patient Simulator Module
 *
 * Handles the patient simulation logic including:
 * - Loading patient profiles from JSON data
 * - Generating AI responses that simulate realistic patient communication
 * - Managing conversation state and diagnosis evaluation
 */

// Define types for patient profiles
export interface PatientProfile {
  id: string;
  condition: string;
  symptoms: string[];
  medicalHistory: string;
  personalityTraits: string[];
  demographicInfo: {
    age: number;
    gender: string;
    occupation?: string;
  };
  conditionDetails: {
    description: string;
    keyDiagnosticCriteria: string[];
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Sample patient profiles data
const patientProfiles: PatientProfile[] = [
  {
    id: "migraine-001",
    condition: "Migraine",
    symptoms: [
      "Severe headache",
      "Sensitivity to light",
      "Nausea",
      "Visual disturbances",
    ],
    medicalHistory:
      "Recurring headaches for the past 5 years, family history of migraines",
    personalityTraits: ["anxious", "detail-oriented", "worried"],
    demographicInfo: {
      age: 34,
      gender: "female",
      occupation: "Software Developer",
    },
    conditionDetails: {
      description:
        "Migraine is a neurological condition characterized by intense, debilitating headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.",
      keyDiagnosticCriteria: [
        "Unilateral headache",
        "Pulsating quality",
        "Moderate to severe intensity",
        "Aggravated by physical activity",
      ],
    },
  },
  {
    id: "diabetes-002",
    condition: "Type 2 Diabetes",
    symptoms: [
      "Increased thirst",
      "Frequent urination",
      "Fatigue",
      "Blurred vision",
      "Slow healing wounds",
    ],
    medicalHistory: "Family history of diabetes, overweight for 10 years",
    personalityTraits: ["forgetful", "concerned", "cooperative"],
    demographicInfo: {
      age: 52,
      gender: "male",
      occupation: "Accountant",
    },
    conditionDetails: {
      description:
        "Type 2 diabetes is a chronic condition that affects the way the body processes blood sugar (glucose).",
      keyDiagnosticCriteria: [
        "Fasting glucose ≥126 mg/dL",
        "HbA1c ≥6.5%",
        "Random glucose ≥200 mg/dL with symptoms",
      ],
    },
  },
  {
    id: "pneumonia-003",
    condition: "Pneumonia",
    symptoms: [
      "Persistent cough",
      "Fever",
      "Shortness of breath",
      "Chest pain",
      "Fatigue",
    ],
    medicalHistory: "Recent cold symptoms, smoker for 15 years",
    personalityTraits: ["impatient", "direct", "skeptical"],
    demographicInfo: {
      age: 45,
      gender: "male",
      occupation: "Construction Worker",
    },
    conditionDetails: {
      description:
        "Pneumonia is an infection that inflames air sacs in one or both lungs, which may fill with fluid.",
      keyDiagnosticCriteria: [
        "Chest X-ray showing infiltrates",
        "Fever >38°C",
        "Productive cough",
        "Elevated white blood cell count",
      ],
    },
  },
];

/**
 * Loads a random patient profile from the available profiles
 */
export function loadRandomPatientProfile(): PatientProfile {
  const randomIndex = Math.floor(Math.random() * patientProfiles.length);
  return patientProfiles[randomIndex];
}

/**
 * Loads a specific patient profile by ID
 */
export function loadPatientProfileById(id: string): PatientProfile | null {
  return patientProfiles.find((profile) => profile.id === id) || null;
}

/**
 * Gets all available patient profiles
 */
export function getAllPatientProfiles(): PatientProfile[] {
  return [...patientProfiles];
}

/**
 * Evaluates if a diagnosis is correct
 */
export function evaluateDiagnosis(
  diagnosis: string,
  actualCondition: string,
): boolean {
  const normalizedDiagnosis = diagnosis.toLowerCase().trim();
  const normalizedCondition = actualCondition.toLowerCase().trim();

  // Check for exact match or partial match
  return (
    normalizedDiagnosis.includes(normalizedCondition) ||
    normalizedCondition.includes(normalizedDiagnosis)
  );
}

/**
 * Generates a patient response based on the current conversation and patient profile
 * Uses OpenAI's GPT-4 API to generate realistic patient responses via API route
 */
export async function generatePatientResponse(
  messages: Message[],
  patientProfile: PatientProfile,
): Promise<string> {
  try {
    // Build the conversation history for the API
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call our API route instead of OpenAI directly
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
        patientProfile,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.response;
  } catch (error) {
    console.error("Error generating patient response:", error);
    return "Sorry, something went wrong with the patient simulation. Please try again.";
  }
}

/**
 * Creates a new conversation message
 */
export function createMessage(
  role: "user" | "assistant",
  content: string,
): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
  };
}

/**
 * Formats a diagnosis result with feedback
 */
export function formatDiagnosisResult(
  userDiagnosis: string,
  actualCondition: string,
  explanation: string,
  isCorrect: boolean,
): string {
  const resultEmoji = isCorrect ? "✅" : "❌";
  const resultText = isCorrect ? "Correct diagnosis!" : "Incorrect diagnosis.";

  return `${resultEmoji} ${resultText}\n\nActual condition: ${actualCondition}\n\n${explanation}`;
}
