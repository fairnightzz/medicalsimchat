"use client";
import ChatInterface from "@/components/ChatInterface";
import { usePatientSimulation } from "@/hooks/usePatientSimulation";

export default function HomePage() {
  const {
    patientSummary,
    patient,
    allProfiles,
    messages,
    loading,
    writeupModalOpen,
    setWriteupModalOpen,
    actions: {
      sendUserMessage,
      newRandomPatient,
      selectPatient,
      submitWriteup,
    },
  } = usePatientSimulation();

  // Provide labels for profile selector
  const profileOptions = allProfiles.map(p => ({
    id: p.id,
    label: p.chiefComplaintSummary || p.name,
  }));

  return (
    <ChatInterface
      messages={messages}
      patientSummary={patientSummary}
      profiles={profileOptions}
      loading={loading}
      writeupModalOpen={writeupModalOpen}
      setWriteupModalOpen={setWriteupModalOpen}
      onSendMessage={sendUserMessage}
      onNewPatient={newRandomPatient}
      onSelectPatient={selectPatient}
      onSubmitWriteup={submitWriteup}
    />
  );
}
