/**
 * Single source of truth for exam types and subject categories.
 * Client-safe (no mongoose) — imported by models, APIs, and UI alike.
 *
 * Categories are SUBJECTS: readiness, diagnostics, focus areas and topic
 * grouping all roll up to the subject level. Topics carry the chapter detail
 * in their name/subcategory.
 */

export type ExamType = 'NEET' | 'JEE';

export const EXAM_TYPES: ExamType[] = ['NEET', 'JEE'];

export const SUBJECTS = ['PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS'] as const;
export type Subject = (typeof SUBJECTS)[number];

/** Which subjects each exam actually tests. */
export const EXAM_SUBJECTS: Record<ExamType, Subject[]> = {
  NEET: ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'],
  JEE: ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'],
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BIOLOGY: 'Biology',
  MATHEMATICS: 'Mathematics',
};

export const EXAM_LABELS: Record<ExamType, string> = {
  NEET: 'NEET',
  JEE: 'JEE',
};

/**
 * Readiness weights per exam, mirroring real paper composition:
 * NEET: 180 of 360 marks come from Biology (Botany+Zoology) → 50/25/25.
 * JEE: three equal papers → even thirds.
 */
export const READINESS_WEIGHTS: Record<ExamType, Partial<Record<Subject, number>>> = {
  NEET: { BIOLOGY: 0.5, PHYSICS: 0.25, CHEMISTRY: 0.25 },
  JEE: { PHYSICS: 1 / 3, CHEMISTRY: 1 / 3, MATHEMATICS: 1 / 3 },
};

export function subjectsForExam(examType?: string | null): Subject[] {
  return EXAM_SUBJECTS[(examType as ExamType) in EXAM_SUBJECTS ? (examType as ExamType) : 'NEET'];
}

export function isValidSubject(value: string): value is Subject {
  return (SUBJECTS as readonly string[]).includes(value);
}

export function examLabel(examType?: string | null): string {
  return examType === 'JEE' ? 'JEE' : examType === 'NEET' ? 'NEET' : 'NEET / JEE';
}
