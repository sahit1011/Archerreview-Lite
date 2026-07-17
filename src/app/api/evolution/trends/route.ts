import { NextRequest, NextResponse } from 'next/server';
import { analyzeLongTermTrends } from '../../../../services/evolutionAgent';
import dbConnect from '../../../../lib/db';
import { requireAuth } from '@/lib/api-auth';
import { User } from '../../../../models';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Connect to database
    await dbConnect();

    // Use the authenticated (token-derived) userId
    const userIdToUse = userId;

    // Get period from query params (default to MONTHLY)
    const periodParam = request.nextUrl.searchParams.get('period');
    const period = (periodParam as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY') || 'MONTHLY';
    console.log('Using period:', period);

    // Validate period
    if (!['WEEKLY', 'MONTHLY', 'QUARTERLY'].includes(period)) {
      console.warn('Invalid period provided:', periodParam);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid period. Must be one of: WEEKLY, MONTHLY, QUARTERLY'
        },
        { status: 400 }
      );
    }

    // Run trend analysis
    console.log('Running trend analysis for user:', userIdToUse);
    const trendAnalysis = await analyzeLongTermTrends(userIdToUse, period);
    console.log('Trend analysis completed successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      trendAnalysis
    });
  } catch (error) {
    console.error('Error in trend analysis API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error analyzing trends',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
