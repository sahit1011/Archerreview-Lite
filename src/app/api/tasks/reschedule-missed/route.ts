import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Task, StudyPlan, User, Alert } from '@/models';
import { addDays, addHours, startOfDay, endOfDay } from 'date-fns';

/**
 * API endpoint for rescheduling missed tasks
 * POST /api/tasks/reschedule-missed
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: userId'
        },
        { status: 400 }
      );
    }

    // Get user's study plan
    const studyPlan = await StudyPlan.findOne({ user: body.userId });
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Study plan not found'
        },
        { status: 404 }
      );
    }

    // Get user preferences
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Find all missed tasks (tasks that are past due and not completed)
    const currentDate = new Date();
    const missedTasks = await Task.find({
      plan: studyPlan._id,
      status: 'PENDING',
      endTime: { $lt: currentDate }
    }).populate('topic').sort({ endTime: 1 }); // Sort by end time (oldest first)

    if (missedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missed tasks found to reschedule',
        rescheduledTasks: []
      });
    }

    // Get future tasks to find available slots
    const futureTasks = await Task.find({
      plan: studyPlan._id,
      startTime: { $gte: currentDate }
    }).sort({ startTime: 1 });

    // Get the exam date
    const examDate = studyPlan.examDate;

    // Calculate available days between now and exam date
    const availableDays = [];
    const daysUntilExam = Math.ceil((examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get user's available days of the week
    const userAvailableDays = user.preferences?.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Generate dates for the next 14 days or until exam date, whichever is sooner
    const maxDays = Math.min(daysUntilExam, 14);
    for (let i = 1; i <= maxDays; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);

      // Check if this day of the week is available for the user
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (userAvailableDays.includes(dayName)) {
        availableDays.push(date);
      }
    }

    // If no available days, use the next 7 days anyway
    if (availableDays.length === 0) {
      for (let i = 1; i <= 7; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + i);
        availableDays.push(date);
      }
    }

    // Reschedule each missed task
    const rescheduledTasks = [];
    const failedTasks = [];

    for (const missedTask of missedTasks) {
      try {
        // Find an available time slot
        const timeSlot = await findAvailableTimeSlot(
          availableDays,
          futureTasks,
          missedTask.duration
        );

        if (!timeSlot) {
          failedTasks.push({
            id: missedTask._id,
            title: missedTask.title,
            reason: 'No available time slot found'
          });
          continue;
        }

        // Update the task with the new time slot
        const updatedTask = await Task.findByIdAndUpdate(
          missedTask._id,
          {
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            // Store original times if not already set
            originalStartTime: missedTask.originalStartTime || missedTask.startTime,
            originalEndTime: missedTask.originalEndTime || missedTask.endTime
          },
          { new: true }
        );

        // Add the updated task to the list of future tasks to avoid double-booking
        futureTasks.push(updatedTask);

        // Add to rescheduled tasks list
        rescheduledTasks.push({
          id: updatedTask._id,
          title: updatedTask.title,
          oldStartTime: missedTask.startTime,
          newStartTime: updatedTask.startTime,
          topic: missedTask.topic?.name || 'Unknown Topic'
        });
      } catch (error) {
        console.error(`Error rescheduling task ${missedTask._id}:`, error);
        failedTasks.push({
          id: missedTask._id,
          title: missedTask.title,
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Create an alert about the rescheduled tasks
    if (rescheduledTasks.length > 0) {
      const alert = new Alert({
        user: body.userId,
        plan: studyPlan._id,
        type: 'SCHEDULE_CHANGE',
        severity: 'MEDIUM',
        message: `${rescheduledTasks.length} missed ${rescheduledTasks.length === 1 ? 'task has' : 'tasks have'} been rescheduled.`,
        metadata: {
          rescheduledTaskCount: rescheduledTasks.length,
          failedTaskCount: failedTasks.length,
          title: 'Tasks Rescheduled',
          suggestedAction: 'Check your calendar for the updated schedule'
        },
        isResolved: false
      });

      await alert.save();
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Rescheduled ${rescheduledTasks.length} missed ${rescheduledTasks.length === 1 ? 'task' : 'tasks'}${failedTasks.length > 0 ? `, failed to reschedule ${failedTasks.length} ${failedTasks.length === 1 ? 'task' : 'tasks'}` : ''}`,
      rescheduledTasks,
      failedTasks
    });
  } catch (error) {
    console.error('Error rescheduling missed tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reschedule missed tasks',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Find an available time slot for a task
 * @param availableDays Array of available days
 * @param existingTasks Array of existing tasks
 * @param duration Duration in minutes
 * @returns Available time slot or null if none found
 */
async function findAvailableTimeSlot(
  availableDays: Date[],
  existingTasks: any[],
  duration: number
): Promise<{ startTime: Date; endTime: Date } | null> {
  // Define working hours (9 AM to 8 PM)
  const workingHours = Array.from({ length: 12 }, (_, i) => i + 9);

  // Try each available day
  for (const day of availableDays) {
    // Get tasks for this day
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const tasksForDay = existingTasks.filter(task => {
      const taskStart = new Date(task.startTime);
      const taskEnd = new Date(task.endTime);
      return (
        (taskStart >= dayStart && taskStart <= dayEnd) ||
        (taskEnd >= dayStart && taskEnd <= dayEnd) ||
        (taskStart <= dayStart && taskEnd >= dayEnd)
      );
    });

    // Sort tasks by start time
    tasksForDay.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Try each working hour
    for (const hour of workingHours) {
      const potentialStartTime = new Date(day);
      potentialStartTime.setHours(hour, 0, 0, 0);

      const potentialEndTime = new Date(potentialStartTime);
      potentialEndTime.setMinutes(potentialEndTime.getMinutes() + duration);

      // Skip if outside working hours
      if (potentialEndTime.getHours() > 20) {
        continue;
      }

      // Check if this time slot conflicts with existing tasks
      const hasConflict = tasksForDay.some(task => {
        const taskStart = new Date(task.startTime);
        const taskEnd = new Date(task.endTime);

        return (
          (potentialStartTime >= taskStart && potentialStartTime < taskEnd) ||
          (potentialEndTime > taskStart && potentialEndTime <= taskEnd) ||
          (potentialStartTime <= taskStart && potentialEndTime >= taskEnd)
        );
      });

      if (!hasConflict) {
        return {
          startTime: potentialStartTime,
          endTime: potentialEndTime
        };
      }
    }
  }

  // If no slot found in regular hours, try to add to the end of the last day
  const lastDay = availableDays[availableDays.length - 1];
  const fallbackStartTime = new Date(lastDay);
  fallbackStartTime.setHours(20, 0, 0, 0);

  const fallbackEndTime = new Date(fallbackStartTime);
  fallbackEndTime.setMinutes(fallbackEndTime.getMinutes() + duration);

  return {
    startTime: fallbackStartTime,
    endTime: fallbackEndTime
  };
}
