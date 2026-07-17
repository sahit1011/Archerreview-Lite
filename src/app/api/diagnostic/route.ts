import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DiagnosticResult, User, Topic } from '@/models';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, errorResponse, z } from '@/lib/validation';

const createDiagnosticSchema = z.object({
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
  score: z.number().optional(),
  categoryScores: z.array(z.any()).optional(),
  topicScores: z.array(z.any()).optional(),
  answers: z.array(z.any()).optional(),
  weakAreas: z.array(z.any()).optional(),
  recommendedFocus: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request and derive the trusted userId from the token
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Validate request body
    const parsed = await parseBody(request, createDiagnosticSchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

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

    // Create diagnostic result
    const diagnosticResult = new DiagnosticResult({
      user: userId,
      completed: body.completed || false,
      skipped: body.skipped || false,
      score: body.score,
      categoryScores: body.categoryScores || [],
      topicScores: body.topicScores || [],
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

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to save diagnostic result', 500);
  }
}

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

    // Return a generic error response (do not leak error.message to clients)
    return errorResponse('Failed to fetch diagnostic result', 500);
  }
}
