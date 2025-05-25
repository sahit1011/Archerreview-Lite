import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Performance } from '@/models';
import { generateTutorResponse } from '@/services/generativeAI';
import { formatAIResponse } from '@/utils/responseFormatter';

/**
 * API endpoint for the AI Tutor
 * POST /api/tutor
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check if user exists if userId is provided
    let user = null;
    if (body.userId) {
      user = await User.findById(body.userId);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: 'User not found'
          },
          { status: 404 }
        );
      }
    }

    // Get conversation history if provided
    const conversationHistory = body.history || [];

    // Generate response using the Generative AI service
    const rawResponse = await generateTutorResponse(
      body.message,
      body.userId,
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


