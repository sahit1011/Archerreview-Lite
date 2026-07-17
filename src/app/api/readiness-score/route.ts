import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReadinessScore, User } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

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
    
    // Always recompute from the user's real data so the dashboard reflects the
    // latest quizzes/tasks (the model is cheap and this keeps the cached doc
    // and its per-component breakdown fresh). The breakdown is the non-persisted
    // field attached by calculateReadinessScore.
    const computed = await calculateReadinessScore(userId);

    // No study plan => return an honest zeroed score (never fabricate).
    if (!computed) {
      return NextResponse.json({
        success: true,
        readinessScore: {
          overallScore: 0,
          categoryScores: [],
          weakAreas: [],
          strongAreas: [],
          projectedScore: 0,
          breakdown: { hasData: false }
        }
      });
    }

    // Re-fetch the persisted doc with weak/strong areas populated to Topic docs
    // (the shape the dashboard reads), then re-attach the breakdown.
    const populated = await ReadinessScore.findOne({ user: userId })
      .populate('weakAreas')
      .populate('strongAreas')
      .sort({ createdAt: -1 });

    const readinessScore = populated
      ? { ...populated.toObject(), breakdown: (computed as any).breakdown }
      : computed;

    // Return success response
    return NextResponse.json({
      success: true,
      readinessScore
    });
  } catch (error) {
    console.error('Error fetching readiness score:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch readiness score',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

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

    // Calculate readiness score from the user's real data.
    const computed = await calculateReadinessScore(userId);

    // No study plan => cannot compute (never fabricate a score).
    if (!computed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to calculate readiness score. User may not have a study plan or performance data.'
        },
        { status: 400 }
      );
    }

    // Re-fetch with weak/strong areas populated to Topic docs (dashboard shape),
    // then re-attach the non-persisted per-component breakdown.
    const populated = await ReadinessScore.findOne({ user: userId })
      .populate('weakAreas')
      .populate('strongAreas')
      .sort({ createdAt: -1 });

    const readinessScore = populated
      ? { ...populated.toObject(), breakdown: (computed as any).breakdown }
      : computed;

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Readiness score calculated successfully',
      readinessScore
    });
  } catch (error) {
    console.error('Error calculating readiness score:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to calculate readiness score',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
