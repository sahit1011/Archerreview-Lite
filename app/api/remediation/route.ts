import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, parseAuthHeader } from '@/utils/auth';
import { isRateLimited, recordRequest } from '@/utils/rateLimiter';
import {
  generateRemediationSuggestions,
  getRemediationSuggestions,
  resolveRemediationSuggestion,
  createMockRemediationSuggestion
} from '@/services/remediationService';

/**
 * GET /api/remediation
 * Get remediation suggestions for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get the user from the token
    const authHeader = req.headers.get('authorization');
    const token = parseAuthHeader(authHeader);

    // Check if we have a token
    if (!token) {
      // Try to get userId from query params as fallback
      const userId = req.nextUrl.searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get remediation suggestions using userId from query
      const suggestions = await getRemediationSuggestions(userId);
      return NextResponse.json({ suggestions });
    }

    // Verify the token and get the user
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get remediation suggestions
    const suggestions = await getRemediationSuggestions(user.id);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error getting remediation suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get remediation suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/remediation
 * Generate new remediation suggestions for the current user
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user from the token
    const authHeader = req.headers.get('authorization');
    const token = parseAuthHeader(authHeader);

    // Check if we have a token
    if (!token) {
      // Try to get userId from request body as fallback
      const body = await req.json();
      const userId = body.userId;

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if this request is rate limited
      if (isRateLimited(userId, 'remediation')) {
        return NextResponse.json({
          success: false,
          message: 'Rate limited. Please try again later.',
          isRateLimited: true
        }, { status: 429 });
      }

      // Record this request for rate limiting
      recordRequest(userId, 'remediation');

      // For testing purposes, create a mock remediation suggestion
      // This ensures we have something to display even without real data
      const mockSuggestion = await createMockRemediationSuggestion(userId);

      // Also try to generate real remediation suggestions
      try {
        await generateRemediationSuggestions(userId);
      } catch (genError) {
        console.log('Could not generate real suggestions, using mock only:', genError);
      }

      return NextResponse.json({
        result: {
          success: true,
          message: 'Created mock remediation suggestion',
          suggestion: mockSuggestion
        }
      });
    }

    // Verify the token and get the user
    const user = getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this request is rate limited
    if (isRateLimited(user.id, 'remediation')) {
      return NextResponse.json({
        success: false,
        message: 'Rate limited. Please try again later.',
        isRateLimited: true
      }, { status: 429 });
    }

    // Record this request for rate limiting
    recordRequest(user.id, 'remediation');

    // For testing purposes, create a mock remediation suggestion
    const mockSuggestion = await createMockRemediationSuggestion(user.id);

    // Also try to generate real remediation suggestions
    try {
      await generateRemediationSuggestions(user.id);
    } catch (genError) {
      console.log('Could not generate real suggestions, using mock only:', genError);
    }

    return NextResponse.json({
      result: {
        success: true,
        message: 'Created mock remediation suggestion',
        suggestion: mockSuggestion
      }
    });
  } catch (error) {
    console.error('Error generating remediation suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate remediation suggestions' },
      { status: 500 }
    );
  }
}
