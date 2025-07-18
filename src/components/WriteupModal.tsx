"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

/* ---------- Types ---------- */

export interface StructuredWriteupFields {
  ageGender: string;
  chiefComplaint: string;
  hpi: string;
  pmh: string;
  immunizations: string;
  pastSurgical: string;
  medications: string;
  medicationAllergies: string;
  familyHistory: string;
  socialHistory: string;
  sexualHistory: string;
  ros: string;
}

interface WriteupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (writeup: StructuredWriteupFields) => void; // STRUCTURED now
  disabled?: boolean;
  initialValue?: Partial<StructuredWriteupFields>;
}

/* ---------- Constants ---------- */

const EMPTY_FIELDS: StructuredWriteupFields = {
  ageGender: "",
  chiefComplaint: "",
  hpi: "",
  pmh: "",
  immunizations: "",
  pastSurgical: "",
  medications: "",
  medicationAllergies: "",
  familyHistory: "",
  socialHistory: "",
  sexualHistory: "",
  ros: "",
};

/* ---------- Component ---------- */

export default function WriteupModal({
  isOpen,
  onClose,
  onSubmit,
  disabled = false,
  initialValue = {},
}: WriteupModalProps) {
  const [fields, setFields] = useState<StructuredWriteupFields>({
    ...EMPTY_FIELDS,
    ...initialValue,
  });
  const [touched, setTouched] = useState(false);

  // Reset when *opening* (not on every initialValue change to avoid churn).
  useEffect(() => {
    if (isOpen) {
      setFields({ ...EMPTY_FIELDS, ...initialValue });
      setTouched(false);
    }
    // intentionally exclude `initialValue` so parent re-renders with new
    // object don't wipe in-progress user edits mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const update = (key: keyof StructuredWriteupFields, val: string) => {
    setFields(prev => ({ ...prev, [key]: val }));
    if (!touched) setTouched(true);
  };

  const minimalValid =
    fields.ageGender.trim() &&
    fields.chiefComplaint.trim() &&
    fields.hpi.trim();

  const getStructuredPayload = (): StructuredWriteupFields => ({
    ...EMPTY_FIELDS,
    ...fields,
    // optionally normalize whitespace:
    hpi: fields.hpi.trim(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minimalValid || disabled) return;
    onSubmit(getStructuredPayload());
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const wordCount = Object.values(fields)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Submit Final Structured Write‑Up
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Once you submit, the encounter locks and you{" "}
              <span className="font-semibold text-gray-300">
                cannot ask further questions
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {/* Warning Banner */}
          <div className="flex gap-3 rounded-md border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
            <div className="space-y-1">
              <p className="font-medium text-amber-300">
                Final Submission Warning
              </p>
              <p className="leading-snug">
                Ensure core HPI (duration, timing, location, quality, severity,
                progression, associated positives/negatives, functional impact,
                ICE) and relevant histories are covered.
              </p>
            </div>
          </div>

          {/* Two-column grid for most sections */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <FieldBlock
                label="Age and Gender"
                id="ageGender"
                required
                singleLine
                value={fields.ageGender}
                onChange={(v) => update("ageGender", v)}
                placeholder="e.g., 50-year-old female"
              />
              <FieldBlock
                label="Chief Complaint"
                id="chiefComplaint"
                required
                singleLine
                value={fields.chiefComplaint}
                onChange={(v) => update("chiefComplaint", v)}
                placeholder='e.g., "Crampy abdominal pain and constipation"'
              />
              <FieldBlock
                label="Past Medical History"
                id="pmh"
                value={fields.pmh}
                onChange={(v) => update("pmh", v)}
                placeholder="Chronic conditions, pertinent positives/negatives"
              />
              <FieldBlock
                label="Immunizations"
                id="immunizations"
                value={fields.immunizations}
                onChange={(v) => update("immunizations", v)}
                placeholder="Up to date? Any gaps?"
              />
              <FieldBlock
                label="Past Surgical History"
                id="pastSurgical"
                value={fields.pastSurgical}
                onChange={(v) => update("pastSurgical", v)}
                placeholder="Surgeries / dates if relevant"
              />
              <FieldBlock
                label="Medications"
                id="medications"
                value={fields.medications}
                onChange={(v) => update("medications", v)}
                placeholder="Prescription / OTC / supplements"
              />
            </div>

            <div className="space-y-3">
              <FieldBlock
                label="Medication Allergies"
                id="medAllergies"
                value={fields.medicationAllergies}
                onChange={(v) => update("medicationAllergies", v)}
                placeholder="Include reaction"
              />
              <FieldBlock
                label="Family History"
                id="familyHistory"
                value={fields.familyHistory}
                onChange={(v) => update("familyHistory", v)}
                placeholder="Relevant hereditary conditions"
              />
              <FieldBlock
                label="Social History"
                id="socialHistory"
                value={fields.socialHistory}
                onChange={(v) => update("socialHistory", v)}
                placeholder="Tobacco, alcohol, substances, occupation, stressors"
              />
              <FieldBlock
                label="Sexual History"
                id="sexualHistory"
                value={fields.sexualHistory}
                onChange={(v) => update("sexualHistory", v)}
                placeholder="Partners, practices, protection, contraception"
              />
              <FieldBlock
                label="Review of Systems"
                id="ros"
                value={fields.ros}
                onChange={(v) => update("ros", v)}
                placeholder="Pertinent positives & key negatives"
              />
            </div>
          </div>

          {/* Full-width HPI */}
          <div>
            <FieldBlock
              label="History of Present Illness"
              id="hpi"
              required
              value={fields.hpi}
              onChange={(v) => update("hpi", v)}
              placeholder="Chronological narrative with all key HPI elements..."
              large
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>
              Aggregate word count:{" "}
              <span
                className={
                  wordCount < 80 || wordCount > 600
                    ? "text-amber-400"
                    : "text-green-400"
                }
              >
                {wordCount}
              </span>{" "}
              (suggested 150–350)
            </span>
            {touched && !minimalValid && (
              <span className="text-red-400">
                Age/Gender, Chief Complaint & HPI required
              </span>
            )}
          </div>

          <DialogFooter className="pt-2 flex flex-col gap-2">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={disabled}
                className="flex-1 border-gray-600 bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!minimalValid || disabled}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50"
              >
                Submit Write‑Up (Lock Encounter)
              </Button>
            </div>
            <p className="text-[11px] text-center text-gray-500">
              After submission you will receive scoring & feedback.
            </p>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Reusable Field Block ---------- */

interface FieldBlockProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  singleLine?: boolean;
  large?: boolean;
}

function FieldBlock({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  singleLine,
  large,
}: FieldBlockProps) {
  const baseLabel = `${label}${required ? " *" : ""}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold tracking-wide">
        {baseLabel}
      </Label>
      {singleLine ? (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 h-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-y ${large ? "min-h-[160px]" : "min-h-[90px]"
            }`}
        />
      )}
    </div>
  );
}
