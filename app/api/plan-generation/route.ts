import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, StudyPlan, DiagnosticResult } from '@/models';
import { generateStudyPlan } from '@/services/schedulerAgent';

/**
 * API endpoint for generating a study plan
 * POST /api/plan-generation
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId) {
      console.error('Plan generation API: Missing required field: userId');
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: userId'
        },
        { status: 400 }
      );
    }

    console.log('Plan generation API: Received userId:', body.userId);

    // Check if user exists
    const user = await User.findById(body.userId);
    if (!user) {
      console.error('Plan generation API: User not found with ID:', body.userId);
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    console.log('Plan generation API: Found user:', user.name, user._id);

    // Check if user already has a study plan
    let studyPlan = await StudyPlan.findOne({ user: body.userId });

    // If no study plan exists, create one
    if (!studyPlan) {
      studyPlan = new StudyPlan({
        user: body.userId,
        examDate: user.examDate,
        isPersonalized: false,
        startDate: new Date(),
        endDate: user.examDate
      });

      await studyPlan.save();
    }

    // Check if diagnostic result exists
    const diagnosticResult = await DiagnosticResult.findOne({ user: body.userId })
      .sort({ createdAt: -1 });

    // Set personalization flag based on diagnostic result
    if (diagnosticResult && diagnosticResult.completed && !diagnosticResult.skipped) {
      studyPlan.isPersonalized = true;
      await studyPlan.save();
    }

    // Generate study plan with tasks
    const generatedPlan = await generateStudyPlan(body.userId, studyPlan._id);

    // Prepare response message based on validation results
    let message = 'Study plan generated successfully';
    if (generatedPlan.validation && !generatedPlan.validation.isValid) {
      message += ' with some optimization suggestions';
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message,
      studyPlan: generatedPlan.studyPlan,
      tasks: generatedPlan.tasks,
      validation: generatedPlan.validation,
      isPersonalized: studyPlan.isPersonalized
    });
  } catch (error) {
    console.error('Error generating study plan:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate study plan',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving a generated study plan
 * GET /api/plan-generation?userId=<userId>
 */
// Removed duplicate import from here

// ... (keep existing imports)

/**
 * API endpoint for retrieving a generated study plan
 * GET /api/plan-generation?userId=<userId>
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase(); // Use the correct function name

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required query parameter: userId'
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Get study plan
    const studyPlan = await StudyPlan.findOne({ user: userId });
    if (!studyPlan) {
      return NextResponse.json(
        {
          success: false,
          message: 'Study plan not found for this user'
        },
        { status: 404 }
      );
    }

    // Get tasks for the study plan
    const tasks = await fetch(`${request.nextUrl.origin}/api/tasks?planId=${studyPlan._id}`)
      .then(res => res.json());

    // Get all topics for validation
    const topics = await fetch(`${request.nextUrl.origin}/api/topics`)
      .then(res => res.json())
      .then(data => data.success ? data.topics : []);

    // Create a simplified schedule for validation
    const tasksByDay = new Map();

    if (tasks.success && tasks.tasks.length > 0) {
      tasks.tasks.forEach((task: any) => {
        const dateStr = new Date(task.startTime).toDateString();

        if (!tasksByDay.has(dateStr)) {
          tasksByDay.set(dateStr, {
            date: new Date(task.startTime),
            availableMinutes: 240, // Default 4 hours
            tasks: []
          });
        }

        tasksByDay.get(dateStr).tasks.push({
          topic: task.topic,
          duration: task.duration,
          type: task.type,
          difficulty: task.difficulty
        });
      });
    }

    // Convert map to array for validation
    const schedule = Array.from(tasksByDay.values());

    // Validate the plan
    const validation = schedule.length > 0 && topics.length > 0 ?
      await import('@/utils/planValidation').then(module =>
        module.validateStudyPlan(tasks.success ? tasks.tasks : [], topics, schedule)
      ) :
      { isValid: true, issues: {} };

    // Return success response
    return NextResponse.json({
      success: true,
      studyPlan,
      tasks: tasks.success ? tasks.tasks : [],
      validation,
      isPersonalized: studyPlan.isPersonalized
    });
  } catch (error) {
    console.error('Error fetching generated study plan:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch generated study plan',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
