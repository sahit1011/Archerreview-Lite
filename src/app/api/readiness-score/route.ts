import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReadinessScore, User } from '@/models';
import { calculateReadinessScore } from '@/lib/dbUtils';

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
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
    
    // Get readiness score
    let readinessScore = await ReadinessScore.findOne({ user: userId })
      .populate('weakAreas')
      .populate('strongAreas')
      .sort({ createdAt: -1 });
    
    // If no readiness score exists, calculate it
    if (!readinessScore) {
      readinessScore = await calculateReadinessScore(userId);
      
      // If still no readiness score, return default
      if (!readinessScore) {
        return NextResponse.json({ 
          success: true, 
          readinessScore: {
            overallScore: 0,
            categoryScores: [],
            weakAreas: [],
            strongAreas: [],
            projectedScore: 0
          }
        });
      }
    }
    
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
    
    // Calculate readiness score
    const readinessScore = await calculateReadinessScore(body.userId);
    
    // If no readiness score could be calculated, return error
    if (!readinessScore) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to calculate readiness score. User may not have a study plan or performance data.' 
        },
        { status: 400 }
      );
    }
    
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
