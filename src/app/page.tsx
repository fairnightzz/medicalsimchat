"use client";

import ChatInterface from "@/components/ChatInterface";
import {
  generatePatientResponse,
  loadRandomPatientProfile,
  PatientProfile,
  Message,
} from "@/lib/patientSimulator";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentPatient, setCurrentPatient] = useState<PatientProfile | null>(
    null,
  );

  useEffect(() => {
    // Load a random patient profile when the component mounts
    const profile = loadRandomPatientProfile();
    setCurrentPatient(profile);
  }, []);

  const handleSendMessage = async (message: string): Promise<string> => {
    if (!currentPatient) {
      return "I'm not feeling well today. Can you help me, doctor?";
    }

    // Convert the message to the format expected by generatePatientResponse
    const messages: Message[] = [
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      },
    ];

    try {
      const response = await generatePatientResponse(messages, currentPatient);
      return response;
    } catch (error) {
      console.error("Error generating patient response:", error);
      return "I'm sorry, I'm not feeling well enough to respond right now. Can we try again?";
    }
  };

  const handleNewPatient = () => {
    // Load a new random patient profile
    const newProfile = loadRandomPatientProfile();
    setCurrentPatient(newProfile);
  };

  const handleSelectPatient = (patientId: string) => {
    // Load the specific patient profile by ID
    const { getAllPatientProfiles } = require("@/lib/patientSimulator");
    const allProfiles = getAllPatientProfiles();
    const selectedProfile = allProfiles.find(
      (profile) => profile.id === patientId,
    );

    if (selectedProfile) {
      setCurrentPatient(selectedProfile);
    }
  };

  if (!currentPatient) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading patient profile...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <ChatInterface
        onSendMessage={handleSendMessage}
        onNewPatient={handleNewPatient}
        onSelectPatient={handleSelectPatient}
        patientProfile={{
          id: currentPatient.id,
          condition: currentPatient.condition,
          symptoms: currentPatient.symptoms,
          personality: currentPatient.personalityTraits.join(", "),
          history: currentPatient.medicalHistory,
          explanation: currentPatient.conditionDetails.description,
        }}
      />
    </div>
  );
}
