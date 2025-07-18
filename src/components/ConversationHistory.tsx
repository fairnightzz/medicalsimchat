"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationHistoryProps {
  messages?: Message[];
  patientName?: string;
}

export default function ConversationHistory({
  messages = [
    {
      id: "1",
      role: "assistant",
      content:
        "Hello doctor, I've been having this terrible headache for the past few days.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "2",
      role: "user",
      content:
        "I'm sorry to hear that. Can you describe the pain? Is it constant or does it come and go?",
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
    },
    {
      id: "3",
      role: "assistant",
      content:
        "It's mostly constant, but gets worse in the afternoon. It feels like pressure behind my eyes and sometimes spreads to my neck. I've tried taking over-the-counter painkillers but they barely help.",
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
    },
  ],
  patientName = "John Doe",
}: ConversationHistoryProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">
          Conversation with Patient
        </h2>
        <p className="text-sm text-gray-400">Patient: {patientName}</p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white ml-12"
                    : "bg-gray-700 text-gray-100 mr-12"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <span className="text-xs opacity-70 mt-2 block">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          {/* Loading indicator */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-700 text-gray-100 mr-12">
              <p className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-150"></span>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-300"></span>
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
