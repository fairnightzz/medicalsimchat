"use client";

import { useState, useEffect } from "react";
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
import { AlertTriangle } from "lucide-react";

interface WriteupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (writeup: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export default function WriteupModal({
  isOpen,
  onClose,
  onSubmit,
  disabled = false,
  initialValue = "",
}: WriteupModalProps) {
  const [writeup, setWriteup] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWriteup(initialValue);
      setTouched(false);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeup.trim()) return;
    onSubmit(writeup.trim());
    // DO NOT auto-close if you want a grading view to appear afterward;
    // if you *do* want it to close immediately, uncomment:
    // onClose();
  };

  const wordCount = writeup.trim()
    ? writeup.trim().split(/\s+/).length
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] bg-gray-800 border-gray-700 text-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Submit Final Clinical Write‑Up
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Once you submit, the encounter is locked and you <span className="font-semibold text-gray-300">cannot ask the patient more questions</span>.
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
                Submitting ends the interview. Make sure you have gathered all history
                (duration, location, quality, severity, associated positives/negatives, functional impact, ICE, risk factors) before proceeding.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="writeup"
              className="text-sm font-medium text-white"
            >
              Clinical Write‑Up
            </Label>
            <Textarea
              id="writeup"
              placeholder={`Recommended structure:
- Chief Complaint (in patient words)
- One-line Summary (age, sex, key context)
- HPI (chronological narrative; include duration, timing, location, quality, severity, progression, associated symptoms & denials, functional impact, patient concerns/ICE)
- Pertinent PMH / Meds / Allergies / Family / Social (only relevant items)
- Pertinent ROS
- Assessment: leading diagnosis + top differentials
- Initial Plan: diagnostics, therapeutics, patient education`}
              value={writeup}
              onChange={(e) => {
                setWriteup(e.target.value);
                if (!touched) setTouched(true);
              }}
              className="min-h-[300px] w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-y"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>
                Word count:{" "}
                <span
                  className={
                    wordCount < 80 || wordCount > 400
                      ? "text-amber-400"
                      : "text-green-400"
                  }
                >
                  {wordCount}
                </span>{" "}
                (target 120–250)
              </span>
              {touched && !writeup.trim() && (
                <span className="text-red-400">Write‑up required</span>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col gap-2">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!writeup.trim() || disabled}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                Submit Write‑Up (Ends Encounter)
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
