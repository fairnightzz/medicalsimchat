"use client";
import { ChatDisplayMessage } from "@/types/chat";
import clsx from "clsx";

export default function MessageBubble({ msg }: { msg: ChatDisplayMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white ml-12"
            : "bg-gray-700 text-gray-100 mr-12",
          msg.partial && "opacity-70 italic"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
        <span className="text-xs opacity-70 mt-2 block">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {msg.partial ? " • drafting" : ""}
        </span>
      </div>
    </div>
  );
}
