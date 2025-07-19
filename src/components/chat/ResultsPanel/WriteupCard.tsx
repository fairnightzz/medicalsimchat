"use client";
import type { StructuredWriteup } from "@/types/grading";
import { labelMap } from "../ChatInterface";

export default function WriteupCard({
  writeup,
  loading,
}: {
  writeup: StructuredWriteup | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-gray-800/70 border border-gray-700 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4">Submitted Write‑Up</h2>
      {!writeup && !loading && (
        <p className="text-sm text-gray-400">
          No write‑up captured (submission failed?).
        </p>
      )}
      {loading && <p className="text-sm text-gray-400">Scoring…</p>}
      {writeup && !loading && (
        <dl className="space-y-4">
          {(Object.keys(writeup) as (keyof StructuredWriteup)[])
            .filter(k => writeup[k].trim())
            .map(k => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-gray-400">
                  {labelMap[k]}
                </dt>
                <dd className="text-sm text-gray-100 whitespace-pre-wrap mt-1">
                  {writeup[k]}
                </dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  );
}
