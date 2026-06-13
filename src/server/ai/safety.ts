// Safety guardrails shared by every AI feature.
//
// Two layers:
//  1. SAFETY_RULES is appended to every system prompt (instructs the model).
//  2. detectMedicalQuestion() scans text in code so a flagged conversation
//     always produces a human ReviewTask regardless of model behavior.

export const SAFETY_RULES = `
Safety rules (non-negotiable):
- Never give medical advice, diagnose conditions, or interpret test results medically.
- Never promise, imply, or guarantee health outcomes from any product.
- Products may be described only in general lifestyle/wellness terms.
- If the context involves a medical question or health concern, do not answer it;
  recommend the person speak with an appropriate healthcare professional.
- Be honest, warm, and low-pressure. Never use manipulative sales tactics.`;

const MEDICAL_PATTERNS: RegExp[] = [
  /\b(diagnos\w*|symptom\w*|disease|illness|medication|prescri\w*|dosage)\b/i,
  /\b(is it safe (for|to|with)|side effects?|interact\w* with|contraindicat\w*)\b/i,
  /\b(my (doctor|condition|diagnosis)|i (have|was diagnosed with)\b)/i,
  /\b(cure|treat\w*|heal\w*)\b.{0,40}\b(cancer|diabetes|arthritis|depression|anxiety|adhd|condition|disease)\b/i,
  /\b(pregnan\w*|breastfeed\w*|blood pressure|cholesterol medication)\b/i,
];

export function detectMedicalQuestion(text: string): boolean {
  return MEDICAL_PATTERNS.some((re) => re.test(text));
}

/** Safe fallback used when a draft request is flagged as medical. */
export function medicalReferralTemplate(contactFirstName: string): string {
  return (
    `Hi ${contactFirstName}! Thanks so much for your question. ` +
    `That's something I'm not able to advise on, but it would be a great one for your ` +
    `doctor or pharmacist — they can give you guidance that's right for your situation. ` +
    `I'm always happy to help with anything about the products themselves!`
  );
}
