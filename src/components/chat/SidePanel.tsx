"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Menu, User, X, RefreshCw } from "lucide-react";
import React from "react";

/**
 * A minimal patient summary shape that works for BOTH
 * the text chat and realtime encounter pages.
 */
export interface PatientPanelSummary {
  id: string;
  name: string;
  age: number;
  gender?: string;
  openingStatement: string;
  chiefComplaintSummary: string;
  currentSymptomStatus?: string;
  affectDescription?: string;           // text version: .affect; realtime: .affectDescription
  mannerisms?: string[];
  chaptersRevealed?: number;            // optional (text mode)
  chaptersTotal?: number;               // optional (text mode)
}

interface SidePanelProps {
  open: boolean;
  setOpen: (o: boolean) => void;

  patientSummary: PatientPanelSummary | null;
  profiles: { id: string; label: string }[];

  /**
   * When true, patient selection & "New" button are disabled.
   * (Use for text: encounterLocked; realtime: connected or finalized.)
   */
  disableSwitching?: boolean;

  /** Alias retained for backward compatibility (text mode). */
  encounterLocked?: boolean;

  onSelectPatient: (id: string) => void;
  onNewPatient: () => void;
}

export default function SidePanel({
  open,
  setOpen,
  patientSummary,
  profiles,
  disableSwitching = false,
  encounterLocked = false,
  onSelectPatient,
  onNewPatient
}: SidePanelProps) {
  const selectedProfileId = patientSummary?.id;

  return (
    <div
      className={`h-full bg-gray-800 transition-all duration-300 border-r border-gray-700 ${open ? "w-80" : "w-16"
        } overflow-hidden flex-shrink-0`}
    >
      <div className="flex items-center justify-between p-6">
        {open ? (
          <>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="text-gray-400 hover:text-white w-full"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {open && patientSummary && (
        <div className="p-4 space-y-5 text-sm">
          {/* Selector Row */}
          <div className="flex items-center gap-2">
            <Select
              value={selectedProfileId}
              onValueChange={(val) => {
                if (disableSwitching) return;
                onSelectPatient(val);
              }}
              disabled={disableSwitching}
            >
              <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 disabled:opacity-50">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (disableSwitching) return;
                onNewPatient();
              }}
              disabled={disableSwitching}
              className="flex items-center gap-1 bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              New
            </Button>
          </div>

          {/* Patient Info */}
          <div className="space-y-2">
            <div className="font-semibold">
              {patientSummary.name}, {patientSummary.age}
              {patientSummary.gender && ` • ${patientSummary.gender}`}
            </div>
            <div className="italic text-gray-300">
              "{patientSummary.openingStatement}"
            </div>
            <div className="text-gray-400">
              CC: {patientSummary.chiefComplaintSummary}
            </div>
            {patientSummary.currentSymptomStatus && (
              <div className="text-gray-400">
                Status: {patientSummary.currentSymptomStatus}
              </div>
            )}
            {/* Chapters only if provided (text mode) */}
            {typeof patientSummary.chaptersRevealed === "number" &&
              typeof patientSummary.chaptersTotal === "number" && (
                <div className="text-gray-400">
                  Chapters: {patientSummary.chaptersRevealed}/
                  {patientSummary.chaptersTotal}
                </div>
              )}
            {patientSummary.affectDescription && (
              <div className="text-gray-400">
                Affect: {patientSummary.affectDescription}
              </div>
            )}
            {!!(patientSummary.mannerisms || []).length && (
              <div className="text-gray-400">
                Mannerisms: {patientSummary.mannerisms!.join(", ")}
              </div>
            )}

            {(encounterLocked || disableSwitching) && (
              <div className="text-xs text-amber-400 pt-2">
                {encounterLocked
                  ? "Encounter locked."
                  : "Switching disabled while live."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
