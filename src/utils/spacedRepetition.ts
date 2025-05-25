import { Difficulty } from '../types';

/**
 * Utility functions for implementing spaced repetition scheduling
 */

/**
 * Calculate the optimal review interval in days based on difficulty and previous performance
 * @param difficulty The difficulty level of the topic
 * @param previousPerformance Previous performance score (0-100)
 * @returns Optimal review interval in days
 */
export function calculateReviewInterval(
  difficulty: string,
  previousPerformance: number = 0
): number {
  // Base intervals by difficulty (in days)
  const baseIntervals: Record<string, number> = {
    'EASY': 7,
    'MEDIUM': 5,
    'HARD': 3
  };

  // Get base interval based on difficulty
  const baseInterval = baseIntervals[difficulty] || baseIntervals['MEDIUM'];

  // Adjust interval based on previous performance
  // Higher performance = longer interval
  let performanceMultiplier = 1.0;

  if (previousPerformance > 0) {
    if (previousPerformance >= 90) {
      performanceMultiplier = 1.5; // Excellent performance, longer interval
    } else if (previousPerformance >= 70) {
      performanceMultiplier = 1.2; // Good performance, slightly longer interval
    } else if (previousPerformance < 50) {
      performanceMultiplier = 0.7; // Poor performance, shorter interval
    }
  }

  // Calculate final interval
  const interval = Math.round(baseInterval * performanceMultiplier);

  // Ensure interval is at least 1 day and at most 14 days
  return Math.min(Math.max(interval, 1), 14);
}

/**
 * Generate review dates for a topic based on initial study date
 * @param initialDate The initial study date
 * @param examDate The exam date
 * @param difficulty The difficulty level of the topic
 * @param maxReviews Maximum number of review sessions to schedule
 * @returns Array of review dates
 */
export function generateReviewDates(
  initialDate: Date,
  examDate: Date,
  difficulty: string,
  maxReviews: number = 3
): Date[] {
  const reviewDates: Date[] = [];
  let currentDate = new Date(initialDate);

  // Calculate days until exam
  const daysUntilExam = Math.ceil(
    (examDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Adjust max reviews based on days until exam
  const adjustedMaxReviews = Math.min(
    maxReviews,
    Math.floor(daysUntilExam / 2) // Ensure at least 2 days between reviews
  );

  // Generate review dates
  for (let i = 0; i < adjustedMaxReviews; i++) {
    // Calculate interval for this review
    // First review uses base interval, subsequent reviews increase interval
    const intervalMultiplier = i === 0 ? 1 : i * 1.5;
    const interval = calculateReviewInterval(difficulty) * intervalMultiplier;

    // Add interval to current date
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + Math.round(interval));

    // Ensure review date is before exam date
    if (currentDate < examDate) {
      reviewDates.push(new Date(currentDate));
    } else {
      break;
    }
  }

  return reviewDates;
}

/**
 * Distribute review sessions across a schedule
 * @param schedule Array of schedule days
 * @param topics Array of topics
 * @param examDate The exam date
 * @returns Updated schedule with review sessions
 */
export function distributeReviewSessions(
  schedule: any[],
  topics: any[],
  examDate: Date
): any[] {
  // Create a copy of the schedule to avoid modifying the original
  const updatedSchedule = [...schedule];

  // Process each topic to add review sessions
  topics.forEach(topic => {
    // Find the initial study day for this topic
    const initialStudyDayIndex = updatedSchedule.findIndex(day =>
      day.tasks.some((task: any) =>
        task.topic &&
        topic._id &&
        task.topic.toString() === topic._id.toString() &&
        task.type !== 'REVIEW'
      )
    );

    // Skip if topic is not scheduled
    if (initialStudyDayIndex === -1) return;

    // Get the initial study date
    const initialStudyDate = updatedSchedule[initialStudyDayIndex].date;

    // Generate review dates
    const reviewDates = generateReviewDates(
      initialStudyDate,
      examDate,
      topic.difficulty
    );

    // Schedule review sessions
    reviewDates.forEach(reviewDate => {
      // Find the closest day to the review date
      const closestDayIndex = findClosestDayIndex(updatedSchedule, reviewDate);

      // Skip if no suitable day found
      if (closestDayIndex === -1) return;

      const day = updatedSchedule[closestDayIndex];

      // Only add review if there's enough time available
      const reviewDuration = 20; // 20 minutes for review
      if (day.availableMinutes >= reviewDuration) {
        // Add review task
        day.tasks.push({
          topic: topic._id,
          duration: reviewDuration,
          type: 'REVIEW',
          difficulty: topic.difficulty
        });

        // Update available minutes
        day.availableMinutes -= reviewDuration;
      }
    });
  });

  return updatedSchedule;
}

/**
 * Find the index of the closest day to a target date
 * @param schedule Array of schedule days
 * @param targetDate The target date
 * @param maxDaysDifference Maximum allowed difference in days
 * @returns Index of the closest day or -1 if not found
 */
function findClosestDayIndex(
  schedule: any[],
  targetDate: Date,
  maxDaysDifference: number = 2
): number {
  let closestIndex = -1;
  let minDifference = Number.MAX_SAFE_INTEGER;

  schedule.forEach((day, index) => {
    const difference = Math.abs(
      (day.date.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only consider days within the maximum allowed difference
    if (difference <= maxDaysDifference && difference < minDifference) {
      minDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}
