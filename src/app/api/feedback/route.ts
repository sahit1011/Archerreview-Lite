import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { processFeedback, getFeedbackHistory } from '@/services/feedbackAgent';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, errorResponse, nonEmptyString, z } from '@/lib/validation';

const submitFeedbackSchema = z.object({
  feedbackText: nonEmptyString,
});

/**
 * API endpoint for submitting user feedback
 * POST /api/feedback
 * Body: { feedbackText: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Validate request body
    const parsed = await parseBody(request, submitFeedbackSchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

    // Process feedback
    const result = await processFeedback(userId, body.feedbackText);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      result
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to submit feedback', 500);
  }
}

/**
 * API endpoint for retrieving feedback history for a specific user
 * GET /api/feedback?userId=<userId>
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Get feedback history for the authenticated user
    const feedbackHistory = await getFeedbackHistory(userId);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      feedbackHistory
    });
  } catch (error) {
    console.error('Error retrieving feedback history:', error);

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to retrieve feedback history', 500);
  }
}
