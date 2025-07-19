"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";

export default function Composer({
  value,
  setValue,
  onSend,
  disabled,
  openWriteup,
  encounterLocked,
}: {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  openWriteup: () => void;
  encounterLocked: boolean;
}) {
  return (
    <div className="border-t border-gray-700 px-6 py-4 bg-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={
                encounterLocked
                  ? "Encounter locked after write‑up."
                  : "Ask or respond..."
              }
              disabled={disabled}
              className="pr-12 bg-gray-700 border-gray-600 text-white placeholder-gray-500 rounded-xl h-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
            />
            <Button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={openWriteup}
            variant="outline"
            className="h-12 px-6 rounded-xl border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
            disabled={encounterLocked}
          >
            {encounterLocked ? "Locked" : "Write‑Up"}
          </Button>
        </div>
      </div>
    </div>
  );
}
