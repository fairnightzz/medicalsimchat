"use client";

interface GradingResult {
  conversationScore: number;
  writeupScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missedConcepts: string[];
  hallucinatedConcepts: string[];
  raw?: any;
}

export default function FeedbackCard({
  gradingResult,
  gradingError,
  loading,
}: {
  gradingResult: GradingResult | null;
  gradingError: string | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-gray-800/70 border border-gray-700 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4">Automated Feedback</h2>
      {loading && <p className="text-sm text-gray-400">Analyzing write‑up…</p>}
      {gradingError && !loading && (
        <p className="text-sm text-red-400">{gradingError}</p>
      )}
      {!gradingError && gradingResult && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <ScorePill label="Conversation" value={gradingResult.conversationScore} />
            <ScorePill label="Write‑Up" value={gradingResult.writeupScore} />
            <ScorePill label="Overall" value={gradingResult.overallScore} />
          </div>
          <ListSection title="Strengths" items={gradingResult.strengths} emptyText="—" />
          <ListSection title="Improvements" items={gradingResult.improvements} emptyText="—" />
          <ListSection title="Missed Elements" items={gradingResult.missedConcepts} pill emptyText="None" />
          <ListSection title="Unsubstantiated / Hallucinated" items={gradingResult.hallucinatedConcepts} pill emptyText="None" />
        </div>
      )}
      {!gradingResult && !gradingError && !loading && (
        <p className="text-sm text-gray-400">No feedback yet.</p>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-gray-700/60 px-3 py-3">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

function ListSection({
  title,
  items,
  emptyText,
  pill,
}: {
  title: string;
  items: string[];
  emptyText?: string;
  pill?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {items.length === 0 && (
        <div className="text-xs text-gray-500">{emptyText || "None"}</div>
      )}
      {items.length > 0 && !pill && (
        <ul className="list-disc ml-5 space-y-1 text-sm text-gray-200">
          {items.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
      {items.length > 0 && pill && (
        <div className="flex flex-wrap gap-2">
          {items.map((i, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-md bg-gray-700 border border-gray-600 text-gray-200"
            >
              {i}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
