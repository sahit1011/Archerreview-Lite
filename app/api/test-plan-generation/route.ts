import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, StudyPlan, Task } from '@/models';

/**
 * API endpoint for testing plan generation
 * GET /api/test-plan-generation
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      // Get the first user
      const user = await User.findOne().sort({ createdAt: -1 });
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'No users found. Please create a user first.' 
          },
          { status: 404 }
        );
      }
      
      // Get the user's study plan
      const studyPlan = await StudyPlan.findOne({ user: user._id });
      
      if (!studyPlan) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'No study plan found for this user.' 
          },
          { status: 404 }
        );
      }
      
      // Get the tasks for this plan
      const tasks = await Task.find({ plan: studyPlan._id }).populate('topic');
      
      return NextResponse.json({ 
        success: true, 
        user,
        studyPlan,
        tasks,
        tasksCount: tasks.length
      });
    } else {
      // Get the user
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'User not found.' 
          },
          { status: 404 }
        );
      }
      
      // Get the user's study plan
      const studyPlan = await StudyPlan.findOne({ user: userId });
      
      if (!studyPlan) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'No study plan found for this user.' 
          },
          { status: 404 }
        );
      }
      
      // Get the tasks for this plan
      const tasks = await Task.find({ plan: studyPlan._id }).populate('topic');
      
      return NextResponse.json({ 
        success: true, 
        user,
        studyPlan,
        tasks,
        tasksCount: tasks.length
      });
    }
  } catch (error) {
    console.error('Error testing plan generation:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test plan generation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
