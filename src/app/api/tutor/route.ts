import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { generateTutorResponse } from '@/services/generativeAI';
import { formatAIResponse } from '@/utils/responseFormatter';
import { requireAuth } from '@/lib/api-auth';

/**
 * API endpoint for the AI Tutor
 * POST /api/tutor
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate: userId is derived from the verified token, never the client
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: message'
        },
        { status: 400 }
      );
    }

    // Get conversation history if provided
    const conversationHistory = body.history || [];

    // Generate response using the Generative AI service
    const rawResponse = await generateTutorResponse(
      body.message,
      userId,
      conversationHistory
    );

    // Format the response
    const formattedResponse = formatAIResponse(rawResponse);

    // Return success response
    return NextResponse.json({
      success: true,
      response: formattedResponse
    });
  } catch (error) {
    console.error('Error in AI Tutor API:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process request',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


