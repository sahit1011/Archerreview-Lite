import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
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
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Get remediation suggestions for the authenticated user
    const suggestions = await getRemediationSuggestions(userId);

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
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

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
  } catch (error) {
    console.error('Error generating remediation suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate remediation suggestions' },
      { status: 500 }
    );
  }
}
