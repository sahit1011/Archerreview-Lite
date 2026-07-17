import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { User, StudyPlan } from '@/models';
import { runRemediationAgent, trackRemediationEffectiveness, RemediationActionType } from '@/services/remediationAgent';
import { findNextAvailableTutorSlot } from '@/services/schedulerUtils';
import { isRateLimited, recordRequest } from '@/utils/rateLimiter';

/**
 * API endpoint for running the Remediation Agent
 * GET /api/remediation-agent
 */
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Check if this request is rate limited
    if (isRateLimited(userId, 'remediation-agent')) {
      return NextResponse.json({
        success: false,
        message: 'Rate limited. Please try again later.',
        isRateLimited: true
      }, { status: 429 });
    }

    // Record this request for rate limiting
    recordRequest(userId, 'remediation-agent');

    // Run remediation agent
    const result = await runRemediationAgent(userId);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error running remediation agent:', error);
    return NextResponse.json(
      { error: 'Failed to run remediation agent' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for scheduling a review session
 * POST /api/remediation-agent/schedule-review
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: topicId'
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

    // Run remediation agent with specific action
    const result = await runRemediationAgent(userId);

    // Find the scheduled review for this topic
    const scheduledReview = result.scheduledReviews.find(
      review => review.topic._id.toString() === body.topicId
    );

    if (!scheduledReview) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to schedule review session'
        },
        { status: 500 }
      );
    }

    // Track the effectiveness of this action
    await trackRemediationEffectiveness(
      userId,
      RemediationActionType.SCHEDULE_REVIEW,
      body.topicId,
      {
        taskId: scheduledReview._id.toString(),
        startTime: scheduledReview.startTime,
        endTime: scheduledReview.endTime,
        duration: scheduledReview.duration,
        source: body.source || 'API'
      }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Review session scheduled successfully',
      scheduledReview
    });
  } catch (error) {
    console.error('Error scheduling review session:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to schedule review session',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint for checking immediate tutor availability
 * GET /api/remediation-agent/tutor-availability
 */
export async function HEAD(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Find next available tutor slot
    const nextSlot = await findNextAvailableTutorSlot(userId);

    // Check if the slot is immediate (within the next 5 minutes)
    const now = new Date();
    const fiveMinutesFromNow = new Date(now);
    fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() + 5);

    const isImmediate = nextSlot.startTime <= fiveMinutesFromNow;

    // Return appropriate status code
    if (isImmediate) {
      // 200 OK means immediate availability
      return new NextResponse(null, { status: 200 });
    } else {
      // 204 No Content means not immediately available
      return new NextResponse(null, { status: 204 });
    }
  } catch (error) {
    console.error('Error checking tutor availability:', error);
    // 500 Internal Server Error means an error occurred
    return new NextResponse(null, { status: 500 });
  }
}
