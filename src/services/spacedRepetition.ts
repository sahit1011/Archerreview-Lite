/**
 * Spaced Repetition Service (SM-2)
 *
 * Implements the SuperMemo SM-2 algorithm for deterministic, performance-driven
 * review scheduling. Given an item's prior review state and a performance grade
 * (0-5), it computes the next interval, an updated ease factor (clamped to >= 1.3),
 * the new repetition count, and the next review date.
 *
 * Reference: SM-2 by P.A. Wozniak.
 *
 * This module deliberately contains NO randomness so that, for the same inputs,
 * it always produces the same output (reproducible study plans).
 *
 * NOTE: The coarse fixed-interval helpers historically lived in
 * `src/utils/spacedRepetition.ts`. Those remain the source of truth and are
 * re-exported here so callers that import review helpers from the services layer
 * keep working. New code should prefer `computeNextReview`.
 */

// Re-export the legacy fixed-interval helpers so existing call sites that may
// import from the services layer continue to resolve. (Source of truth lives in
// src/utils/spacedRepetition.ts.)
export {
  calculateReviewInterval,
  generateReviewDates,
  distributeReviewSessions,
} from '../utils/spacedRepetition';

/** Minimum ease factor allowed by SM-2. */
export const MIN_EASE_FACTOR = 1.3;

/** Default ease factor for a brand-new item (SM-2 standard). */
export const DEFAULT_EASE_FACTOR = 2.5;

/** Performance grade scale used by SM-2 (0 = total blackout, 5 = perfect recall). */
export const MIN_GRADE = 0;
export const MAX_GRADE = 5;

/**
 * The persistent state SM-2 needs to track per review item (e.g. per topic or
 * per task for a given user).
 */
export interface SpacedRepetitionState {
  /** Number of consecutive successful recalls (grade >= 3). */
  repetitions: number;
  /** SM-2 ease factor; always >= MIN_EASE_FACTOR. */
  easeFactor: number;
  /** Current inter-repetition interval, in days. */
  intervalDays: number;
  /** When the item was last reviewed (optional; used to anchor nextReviewDate). */
  lastReviewedAt?: Date;
}

/** Result of an SM-2 computation. */
export interface SpacedRepetitionResult extends SpacedRepetitionState {
  /** The date the item should next be reviewed. */
  nextReviewDate: Date;
  /** The grade that produced this result (0-5). */
  grade: number;
}

/**
 * Sensible defaults for an item that has never been reviewed.
 */
export function defaultSpacedRepetitionState(): SpacedRepetitionState {
  return {
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 0,
  };
}

/** Clamp a number into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Derive an SM-2 grade (0-5) from a quiz score (0-100) and/or a confidence
 * rating (1-5). This is the bridge between the app's Performance data and the
 * SM-2 grade scale, and is fully deterministic.
 *
 * - If a score is provided, it dominates (it is the strongest signal of recall).
 * - Confidence nudges the grade up or down by at most one point.
 * - If only confidence is available, it maps roughly onto the 0-5 scale.
 *
 * @param score Quiz score as a percentage (0-100), if available.
 * @param confidence Self-reported confidence on a 1-5 scale, if available.
 * @returns An integer grade in [0, 5].
 */
export function gradeFromPerformance(
  score?: number | null,
  confidence?: number | null
): number {
  const hasScore = typeof score === 'number' && !Number.isNaN(score);
  const hasConfidence =
    typeof confidence === 'number' && !Number.isNaN(confidence);

  if (hasScore) {
    // Map percentage -> base grade.
    const pct = clamp(score as number, 0, 100);
    let grade: number;
    if (pct >= 95) grade = 5;
    else if (pct >= 85) grade = 4;
    else if (pct >= 70) grade = 3; // passing recall, with effort
    else if (pct >= 50) grade = 2; // wrong, but familiar
    else if (pct >= 25) grade = 1;
    else grade = 0;

    // Let confidence nudge by at most 1 point (center of 1-5 scale is 3).
    if (hasConfidence) {
      const conf = clamp(confidence as number, 1, 5);
      const nudge = conf >= 4 ? 1 : conf <= 2 ? -1 : 0;
      grade = clamp(grade + nudge, MIN_GRADE, MAX_GRADE);
    }
    return Math.round(grade);
  }

  if (hasConfidence) {
    // Confidence 1..5 -> grade 0..5 (deterministic linear-ish mapping).
    const conf = clamp(confidence as number, 1, 5);
    // 1->1, 2->2, 3->3, 4->4, 5->5; reserve 0 for the no-data fallback.
    return Math.round(clamp(conf, MIN_GRADE, MAX_GRADE));
  }

  // No performance data at all: treat as a borderline failed recall so the item
  // is scheduled to be seen again soon, deterministically.
  return 2;
}

/**
 * Add a whole number of days to a date without mutating the input.
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Core SM-2 step.
 *
 * Given the prior state of an item and a performance grade (0-5), compute the
 * next interval, the updated (clamped) ease factor, the new repetition count,
 * and the resulting next review date.
 *
 * SM-2 rules implemented:
 *  - grade < 3  -> failed recall: repetitions reset to 0, interval reset to 1 day.
 *  - grade >= 3 -> successful recall:
 *      rep 1 -> interval 1 day
 *      rep 2 -> interval 6 days
 *      rep n -> round(prevInterval * easeFactor)
 *  - easeFactor updated by: EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
 *    then clamped to >= 1.3 (MIN_EASE_FACTOR).
 *
 * @param state Prior repetition state (use defaultSpacedRepetitionState() for new items).
 * @param grade Performance grade in [0, 5] (see gradeFromPerformance()).
 * @param now The "review happened" timestamp used to anchor nextReviewDate (defaults to new Date()).
 * @returns The updated state plus the next review date.
 */
export function computeNextReview(
  state: SpacedRepetitionState = defaultSpacedRepetitionState(),
  grade: number = 0,
  now: Date = new Date()
): SpacedRepetitionResult {
  // Sanitize inputs so bad/missing data never throws and stays deterministic.
  const q = clamp(Math.round(grade), MIN_GRADE, MAX_GRADE);
  const priorReps = Number.isFinite(state.repetitions)
    ? Math.max(0, Math.floor(state.repetitions))
    : 0;
  const priorEase = Number.isFinite(state.easeFactor)
    ? state.easeFactor
    : DEFAULT_EASE_FACTOR;
  const priorInterval = Number.isFinite(state.intervalDays)
    ? Math.max(0, state.intervalDays)
    : 0;

  // Update ease factor (standard SM-2 formula), then clamp to the floor.
  const easeDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const easeFactor = Math.max(MIN_EASE_FACTOR, priorEase + easeDelta);

  let repetitions: number;
  let intervalDays: number;

  if (q < 3) {
    // Failed recall: restart the repetition cycle, see again tomorrow.
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = priorReps + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      // Grow the interval by the (updated) ease factor.
      intervalDays = Math.round(priorInterval * easeFactor);
    }
    // Guard against degenerate prior interval of 0 producing a 0-day interval.
    if (intervalDays < 1) {
      intervalDays = 1;
    }
  }

  const nextReviewDate = addDays(now, intervalDays);

  return {
    repetitions,
    easeFactor,
    intervalDays,
    lastReviewedAt: now,
    nextReviewDate,
    grade: q,
  };
}

/**
 * Convenience wrapper: compute the next review directly from Performance-style
 * inputs (quiz score and/or confidence), deriving the SM-2 grade internally.
 *
 * @param state Prior repetition state.
 * @param score Quiz score percentage (0-100), if available.
 * @param confidence Confidence rating (1-5), if available.
 * @param now Anchor timestamp for the next review date.
 */
export function computeNextReviewFromPerformance(
  state: SpacedRepetitionState = defaultSpacedRepetitionState(),
  score?: number | null,
  confidence?: number | null,
  now: Date = new Date()
): SpacedRepetitionResult {
  const grade = gradeFromPerformance(score, confidence);
  return computeNextReview(state, grade, now);
}
