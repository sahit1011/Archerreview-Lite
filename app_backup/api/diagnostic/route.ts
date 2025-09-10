import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DiagnosticResult, User, Topic } from '@/models';

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
    
    // Create diagnostic result
    const diagnosticResult = new DiagnosticResult({
      user: body.userId,
      completed: body.completed || false,
      skipped: body.skipped || false,
      score: body.score,
      categoryScores: body.categoryScores || [],
      answers: body.answers || [],
      weakAreas: body.weakAreas || [],
      recommendedFocus: body.recommendedFocus || []
    });
    
    // Save diagnostic result to database
    await diagnosticResult.save();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Diagnostic result saved successfully',
      diagnosticResult
    });
  } catch (error) {
    console.error('Error saving diagnostic result:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save diagnostic result',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

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
    
    // Get diagnostic result
    const diagnosticResult = await DiagnosticResult.findOne({ user: userId })
      .populate('recommendedFocus')
      .sort({ createdAt: -1 });
    
    // If no diagnostic result exists, return empty result
    if (!diagnosticResult) {
      return NextResponse.json({ 
        success: true, 
        diagnosticResult: null
      });
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      diagnosticResult
    });
  } catch (error) {
    console.error('Error fetching diagnostic result:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch diagnostic result',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
