// hooks/useRealtimePatientProfiles.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllPatientProfiles,
  loadRandomPatientProfile,
  loadPatientProfileById,
} from "@/lib/patientSimulator";
import { PatientProfile } from "@/types/patient";

export function useRealtimePatientProfiles(initialId?: string) {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0); // keep if you later gate chapters

  useEffect(() => {
    if (initialId) {
      const p = loadPatientProfileById(initialId);
      setPatient(p || loadRandomPatientProfile());
    } else {
      setPatient(loadRandomPatientProfile());
    }
  }, [initialId]);

  const selectPatient = useCallback((id: string) => {
    const p = loadPatientProfileById(id);
    if (p) {
      setPatient(p);
      setChapterIndex(0);
    }
  }, []);

  const newRandomPatient = useCallback(() => {
    const p = loadRandomPatientProfile();
    setPatient(p);
    setChapterIndex(0);
  }, []);

  return {
    patient,
    chapterIndex,
    setChapterIndex, // if you later allow updating
    allProfiles: getAllPatientProfiles(),
    actions: { selectPatient, newRandomPatient },
  };
}
