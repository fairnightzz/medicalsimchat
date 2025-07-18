// types/patient.ts
export interface PatientProfile {
  id: string;

  // Identity
  name: string;
  age: number;
  gender?: string;
  occupation?: string;
  livingSituation?: string;
  relationshipStatus?: string;
  childrenStatus?: string;

  // Presenting Concern
  openingStatement: string;
  chiefComplaintSummary: string;
  currentSymptomStatus?: string;

  // Affect & Communication
  affectDescription?: string;
  mannerisms?: string[];
  disclosureNotes?: string;

  // Progressive narrative
  narrativeChapters: string[];

  // Structured HPI Answer Bank
  hpi: {
    duration?: string;
    timingPattern?: string;
    location?: string;
    radiation?: string;
    quality?: string;
    severity?: string;
    worseFactors?: string;
    betterFactors?: string;
    associatedPositives?: string;
    associatedNegatives?: string[];  // denials list
    progression?: string;
    functionalImpact?: string;
    ice?: string;                    // Ideas / Concerns / Expectations
  };

  // Additional Symptom Bank(s)
  bowelSymptomBank?: string;

  // Past Medical History
  pmh?: {
    conditions?: string[];
    surgeries?: string[];
    medications?: string[];
    otcSupplements?: string[];
    allergies?: string[];
    immunizations?: string;
  };

  // Social History
  social?: {
    tobacco?: string;
    alcohol?: string;
    drugs?: string;
    diet?: string;
    exercise?: string;
    occupation?: string;
    stressors?: string[];
  };

  // Family History
  familyHistory?: string[];

  // Sexual History
  sexual?: {
    partners?: string;
    orientation?: string;
    activity?: string;
    stiProtection?: string;
    contraception?: string;
  };

  // ROS
  rosPositive?: string[];
  rosNegatives?: string[];

  // Limits
  maxChaptersToReveal?: number;
}
