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

export function structuredWriteupToMarkdown(w: StructuredWriteup) {
  const lines: string[] = [];
  const add = (label: string, v: string) => {
    if (v.trim()) lines.push(`**${label}:** ${v.trim()}`);
  };
  add("Age/Gender", w.ageGender);
  add("Chief Complaint", w.chiefComplaint);
  add("History of Present Illness", w.hpi);
  add("Past Medical History", w.pmh);
  add("Immunizations", w.immunizations);
  add("Past Surgical History", w.pastSurgical);
  add("Medications", w.medications);
  add("Medication Allergies", w.medicationAllergies);
  add("Family History", w.familyHistory);
  add("Social History", w.socialHistory);
  add("Sexual History", w.sexualHistory);
  add("Review of Systems", w.ros);
  return lines.join("\n\n");
}