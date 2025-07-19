// types/chat.ts
export interface ChatDisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  partial?: boolean;
  source: "text" | "realtime";
}
