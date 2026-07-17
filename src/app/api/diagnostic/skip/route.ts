import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DiagnosticResult, User } from '@/models';
import { requireAuth } from '@/lib/api-auth';

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

    // Create diagnostic result with skipped=true
    const diagnosticResult = new DiagnosticResult({
      user: userId,
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
