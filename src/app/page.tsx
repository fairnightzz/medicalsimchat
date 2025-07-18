"use client";
import ChatInterface from "@/components/ChatInterface";
import { usePatientSimulation } from "@/hooks/usePatientSimulation";

export default function HomePage() {
  const {
    patientSummary,
    allProfiles,
    messages,
    loading,
    writeupModalOpen,
    setWriteupModalOpen,
    encounterLocked,
    structuredWriteup,
    gradingResult,
    gradingLoading,
    gradingError,
    actions: {
      sendUserMessage,
      newRandomPatient,
      selectPatient,
      submitWriteup,
    },
  } = usePatientSimulation();

  const profileOptions = allProfiles.map(p => ({
    id: p.id,
    label: p.chiefComplaintSummary || p.name,
  }));

  return (
    <ChatInterface
      /* transcript */
      messages={messages}
      patientSummary={patientSummary}
      profiles={profileOptions}
      loading={loading}

      /* modal control */
      writeupModalOpen={writeupModalOpen}
      setWriteupModalOpen={setWriteupModalOpen}

      /* encounter state / artifacts */
      encounterLocked={encounterLocked}
      structuredWriteup={structuredWriteup}
      gradingResult={gradingResult}
      gradingLoading={gradingLoading}
      gradingError={gradingError}

      /* actions */
      onSendMessage={sendUserMessage}
      onNewPatient={newRandomPatient}
      onSelectPatient={selectPatient}
      onSubmitWriteup={submitWriteup}
    />
  );
}
