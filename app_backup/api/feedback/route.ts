import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models';
import { processFeedback, getFeedbackHistory } from '@/services/feedbackAgent';

/**
 * API endpoint for submitting user feedback
 * POST /api/feedback
 * Body: { userId: string, feedbackText: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.feedbackText) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: userId and feedbackText' 
        },
        { status: 400 }
      );
    }
    
    // Check if user exists
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
    
    // Process feedback
    const result = await processFeedback(body.userId, body.feedbackText);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      result
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit feedback',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for retrieving feedback history for a specific user
 * GET /api/feedback?userId=<userId>
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameter: userId' 
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
    
    // Get feedback history
    const feedbackHistory = await getFeedbackHistory(userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      feedbackHistory
    });
  } catch (error) {
    console.error('Error retrieving feedback history:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve feedback history',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
