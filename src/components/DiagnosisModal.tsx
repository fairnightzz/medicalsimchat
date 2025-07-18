"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface DiagnosisModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (diagnosis: string, notes: string) => void;
  actualCondition?: {
    name: string;
    description: string;
  };
  isCorrect?: boolean;
  feedbackShown?: boolean;
  onReset?: () => void;
}

export default function DiagnosisModal({
  isOpen = true,
  onClose = () => {},
  onSubmit = () => {},
  actualCondition = {
    name: "Hypertension",
    description:
      "High blood pressure condition that can lead to serious health problems, such as heart attack and stroke.",
  },
  isCorrect = false,
  feedbackShown = false,
  onReset = () => {},
}: DiagnosisModalProps) {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(diagnosis, notes);
  };

  const handleReset = () => {
    setDiagnosis("");
    setNotes("");
    onReset();
  };

  return (
    <div className="bg-gray-900 text-white p-4 h-full">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              {feedbackShown ? "Diagnosis Results" : "Submit Your Diagnosis"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {feedbackShown
                ? "Review your diagnosis results below."
                : "Enter your final diagnosis based on the patient conversation."}
            </DialogDescription>
          </DialogHeader>

          {!feedbackShown ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="diagnosis"
                  className="text-sm font-medium text-white"
                >
                  Diagnosis
                </Label>
                <Input
                  id="diagnosis"
                  placeholder="Enter your diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-white"
                >
                  Clinical Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or observations"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                  disabled={!diagnosis.trim()}
                >
                  Submit Diagnosis
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-6">
              <Card
                className={`border-l-4 bg-gray-700 border-gray-600 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium text-white">
                      {isCorrect ? "Correct Diagnosis!" : "Incorrect Diagnosis"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isCorrect
                        ? "Great job! You correctly identified the patient's condition."
                        : "Your diagnosis was not correct. See the actual condition below."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h3 className="font-medium text-white">Your diagnosis:</h3>
                <p className="text-sm bg-gray-700 p-3 rounded-md text-white">
                  {diagnosis}
                </p>

                <h3 className="font-medium pt-2 text-white">
                  Actual condition:
                </h3>
                <div className="bg-gray-700 p-3 rounded-md">
                  <p className="font-medium text-sm text-white">
                    {actualCondition.name}
                  </p>
                  <p className="text-sm mt-1 text-gray-400">
                    {actualCondition.description}
                  </p>
                </div>

                {notes && (
                  <>
                    <h3 className="font-medium pt-2 text-white">Your notes:</h3>
                    <p className="text-sm bg-gray-700 p-3 rounded-md text-white">
                      {notes}
                    </p>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Start New Case
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
