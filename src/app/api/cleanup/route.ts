import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for running all cleanup operations
 * POST /api/cleanup
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

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

    // Run duplicate reviews cleanup
    const reviewsResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/duplicate-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: body.userId }),
    });

    const reviewsResult = await reviewsResponse.json();

    // Run excessive alerts cleanup
    const alertsResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/excessive-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: body.userId }),
    });

    const alertsResult = await alertsResponse.json();

    // Run duplicate time tasks cleanup for all hours
    const timeTasksResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/duplicate-time-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: body.userId,
        // Not specifying hour will process all hours
        date: '2025-05-09'
      }),
    });

    const timeTasksResult = await timeTasksResponse.json();

    // Always run a comprehensive cleanup for all duplicate tasks
    // First, clean up specific date if there are still issues
    if (timeTasksResult.deletedTasks && timeTasksResult.deletedTasks.length > 0) {
      const specificDateResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/all-date-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: body.userId,
          date: '2025-05-09',
          type: 'REVIEW'
        }),
      });

      const specificDateResult = await specificDateResponse.json();
      timeTasksResult.additionalCleanup = specificDateResult;
    }

    // Then run a comprehensive cleanup for all duplicate tasks across all dates
    const comprehensiveResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/duplicate-time-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: body.userId,
        // Not specifying hour or date will process all hours and dates
      }),
    });

    const comprehensiveResult = await comprehensiveResponse.json();
    timeTasksResult.comprehensiveCleanup = comprehensiveResult;

    // Clean up all remediation tasks and alerts
    const remediationResponse = await fetch(`${req.nextUrl.origin}/api/cleanup/remediation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: body.userId
      }),
    });

    const remediationResult = await remediationResponse.json();

    // Return combined results
    return NextResponse.json({
      success: true,
      message: 'Cleanup operations completed successfully',
      reviews: reviewsResult,
      alerts: alertsResult,
      timeTasks: timeTasksResult,
      remediation: remediationResult
    });
  } catch (error) {
    console.error('Error running cleanup operations:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to run cleanup operations',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
