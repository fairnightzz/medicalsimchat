// src/types/grading.ts
export interface GradingResult {
  conversationScore: number;
  writeupScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missedConcepts: string[];
  hallucinatedConcepts: string[];
  raw?: any;
}

export interface StructuredWriteup {
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
