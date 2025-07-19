"use client";
import { Button } from "@/components/ui/button";

export default function ChatHeader({
  encounterLocked,
  openWriteup,
}: {
  encounterLocked: boolean;
  openWriteup: () => void;
}) {
  return (
    <header className="border-b border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-800">
      <div>
        <h1 className="text-xl font-semibold">Clinical Interview Simulator</h1>
        <p className="text-sm text-gray-400">
          {encounterLocked
            ? "Encounter closed — transcript + results below."
            : "Interview the patient, then submit your structured write‑up."}
        </p>
      </div>
      <Button
        variant="outline"
        className="border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
        onClick={openWriteup}
        disabled={encounterLocked}
      >
        {encounterLocked ? "Write‑Up Submitted" : "Submit Write‑Up"}
      </Button>
    </header>
  );
}
