import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DiagnosticResult, User } from '@/models';

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
    
    // Create diagnostic result with skipped=true
    const diagnosticResult = new DiagnosticResult({
      user: body.userId,
      completed: false,
      skipped: true,
      score: 0,
      categoryScores: [],
      answers: [],
      weakAreas: [],
      recommendedFocus: []
    });
    
    // Save diagnostic result to database
    await diagnosticResult.save();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Diagnostic assessment skipped successfully',
      diagnosticResult
    });
  } catch (error) {
    console.error('Error skipping diagnostic assessment:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to skip diagnostic assessment',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
