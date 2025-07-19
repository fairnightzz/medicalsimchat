"use client";
import { usePatientSimulation } from "@/hooks/usePatientSimulation";
import ChatInterface from "@/components/chat/ChatInterface";
import { ChatDisplayMessage } from "@/types/chat";

export default function ChatPage() {
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

  // Convert simulation messages to display messages (no realtime here)
  const displayMessages: ChatDisplayMessage[] = messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    source: "text",
  }));

  const profileOptions = allProfiles.map(p => ({
    id: p.id,
    label: p.chiefComplaintSummary || p.name,
  }));

  return (
    <ChatInterface
      messages={displayMessages}
      patientSummary={patientSummary}
      profiles={profileOptions}
      loading={loading}
      writeupModalOpen={writeupModalOpen}
      setWriteupModalOpen={setWriteupModalOpen}
      encounterLocked={encounterLocked}
      structuredWriteup={structuredWriteup}
      gradingResult={gradingResult}
      gradingLoading={gradingLoading}
      gradingError={gradingError}
      onSendMessage={sendUserMessage}
      onNewPatient={newRandomPatient}
      onSelectPatient={selectPatient}
      onSubmitWriteup={submitWriteup}
    />
  );
}
