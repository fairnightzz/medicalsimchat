"use client";
import { ChatDisplayMessage } from "@/types/chat";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  loading,
  encounterLocked,
  endRef,
}: {
  messages: ChatDisplayMessage[];
  loading: boolean;
  encounterLocked: boolean;
  endRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      {messages.map(m => (
        <MessageBubble key={m.id} msg={m} />
      ))}
      {loading && !encounterLocked && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-700 text-gray-100 mr-12">
            <p className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-150" />
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-300" />
            </p>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </>
  );
}
