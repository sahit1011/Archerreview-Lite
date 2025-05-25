import { addDays, addHours, startOfDay, endOfDay } from 'date-fns';
import dbConnect from '../lib/db'; // Changed to relative
import { Task, User, StudyPlan } from '../models/index'; // Changed to relative

/**
 * Find the optimal time for a review session
 * @param userId User ID
 * @param planId Study plan ID
 * @returns Optimal time for the review session
 */
export async function findOptimalReviewTime(userId: string, planId: string) {
  await dbConnect();

  // Get user's existing tasks for the next 3 days
  const now = new Date();
  const threeDaysLater = addDays(now, 3);

  const existingTasks = await Task.find({
    plan: planId,
    startTime: { $gte: startOfDay(now), $lte: endOfDay(threeDaysLater) }
  }).sort({ startTime: 1 });

  // Get user preferences
  const user = await User.findById(userId);

  // Default duration for review sessions: 30 minutes
  const reviewDuration = 30;

  // Try to find a slot tomorrow
  const tomorrow = addDays(now, 1);
  const tomorrowStart = startOfDay(tomorrow);

  // Get preferred study hours from user preferences or use defaults
  const preferredStartHour = user?.preferences?.startHour || 9;
  const preferredEndHour = user?.preferences?.endHour || 17;

  // Default times to try based on user preferences
  const defaultTimes = [];

  // Morning slot
  if (preferredStartHour < 12) {
    defaultTimes.push(preferredStartHour + 1);
  }

  // Afternoon slot
  if (preferredStartHour < 15 && preferredEndHour > 14) {
    defaultTimes.push(14);
  }

  // Evening slot
  if (preferredEndHour > 17) {
    defaultTimes.push(Math.min(preferredEndHour - 1, 18));
  }

  // If no preferred times could be determined, use defaults
  if (defaultTimes.length === 0) {
    defaultTimes.push(9, 14, 18);
  }

  // Check each default time
  for (const hour of defaultTimes) {
    const potentialStartTime = new Date(tomorrowStart);
    potentialStartTime.setHours(hour, 0, 0, 0);

    // Skip if this time is in the past
    if (potentialStartTime < now) continue;

    const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);

    // Check if this time slot conflicts with existing tasks
    const hasConflict = existingTasks.some(task => {
      return (
        (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
        (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
        (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
      );
    });

    if (!hasConflict) {
      return {
        startTime: potentialStartTime,
        endTime: potentialEndTime,
        duration: reviewDuration
      };
    }
  }

  // If no slot found tomorrow, try the day after
  const dayAfterTomorrow = addDays(now, 2);
  const dayAfterTomorrowStart = startOfDay(dayAfterTomorrow);

  for (const hour of defaultTimes) {
    const potentialStartTime = new Date(dayAfterTomorrowStart);
    potentialStartTime.setHours(hour, 0, 0, 0);

    const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);

    // Check if this time slot conflicts with existing tasks
    const hasConflict = existingTasks.some(task => {
      return (
        (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
        (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
        (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
      );
    });

    if (!hasConflict) {
      return {
        startTime: potentialStartTime,
        endTime: potentialEndTime,
        duration: reviewDuration
      };
    }
  }

  // If still no slot found, use the first available 30-minute slot in the next 3 days
  // Start from 9 AM tomorrow and check every hour until 8 PM
  for (let day = 1; day <= 3; day++) {
    const checkDate = addDays(now, day);
    const checkDateStart = startOfDay(checkDate);

    for (let hour = 9; hour <= 20; hour++) {
      const potentialStartTime = new Date(checkDateStart);
      potentialStartTime.setHours(hour, 0, 0, 0);

      const potentialEndTime = addHours(potentialStartTime, reviewDuration / 60);

      // Check if this time slot conflicts with existing tasks
      const hasConflict = existingTasks.some(task => {
        return (
          (potentialStartTime >= task.startTime && potentialStartTime < task.endTime) ||
          (potentialEndTime > task.startTime && potentialEndTime <= task.endTime) ||
          (potentialStartTime <= task.startTime && potentialEndTime >= task.endTime)
        );
      });

      if (!hasConflict) {
        return {
          startTime: potentialStartTime,
          endTime: potentialEndTime,
          duration: reviewDuration
        };
      }
    }
  }

  // If all else fails, schedule for tomorrow at 9 AM
  const fallbackStartTime = new Date(tomorrowStart);
  fallbackStartTime.setHours(9, 0, 0, 0);

  return {
    startTime: fallbackStartTime,
    endTime: addHours(fallbackStartTime, reviewDuration / 60),
    duration: reviewDuration
  };
}

/**
 * Check if a user has available time for an immediate tutor session
 * @param userId User ID
 * @returns Whether the user has available time
 */
export async function checkImmediateAvailability(userId: string): Promise<boolean> {
  await dbConnect();

  // Get current time
  const now = new Date();

  // Get end of current hour
  const endOfHour = new Date(now);
  endOfHour.setHours(endOfHour.getHours() + 1, 0, 0, 0);

  // Get user's study plan
  const studyPlan = await StudyPlan.findOne({ user: userId });
  if (!studyPlan) return false;

  // Check if there are any tasks scheduled for the current hour
  const currentTasks = await Task.find({
    plan: studyPlan._id,
    startTime: { $lte: endOfHour },
    endTime: { $gte: now },
    status: { $in: ['PENDING', 'IN_PROGRESS'] }
  });

  // If there are no tasks, the user is available
  return currentTasks.length === 0;
}

/**
 * Find the next available time slot for a tutor session
 * @param userId User ID
 * @param duration Duration in minutes
 * @returns Next available time slot
 */
export async function findNextAvailableTutorSlot(userId: string, duration: number = 30): Promise<{
  startTime: Date;
  endTime: Date;
  duration: number;
}> {
  await dbConnect();

  // Get current time
  const now = new Date();

  // Get user's study plan
  const studyPlan = await StudyPlan.findOne({ user: userId });
  if (!studyPlan) {
    // If no study plan, suggest current time
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + duration);

    return {
      startTime: now,
      endTime,
      duration
    };
  }

  // Check if user is available now
  const isAvailableNow = await checkImmediateAvailability(userId);

  if (isAvailableNow) {
    // If available now, suggest current time
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + duration);

    return {
      startTime: now,
      endTime,
      duration
    };
  }

  // Otherwise, find the next available slot using the same logic as review sessions
  return findOptimalReviewTime(userId, studyPlan._id.toString());
}
