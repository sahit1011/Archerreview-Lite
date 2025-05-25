import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, parseAuthHeader } from '@/utils/auth';
import { resolveRemediationSuggestion } from '@/services/remediationService';

/**
 * PATCH /api/remediation/[id]
 * Mark a remediation suggestion as resolved
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user from the token
    const authHeader = req.headers.get('authorization');
    const token = parseAuthHeader(authHeader);

    // For this endpoint, we don't strictly need authentication
    // since resolving a suggestion doesn't require user verification
    // but we'll check the token if it's provided for good practice

    if (token) {
      const user = getUserFromToken(token);
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Get the suggestion ID from the URL
    const suggestionId = params.id;
    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      );
    }

    // Resolve the suggestion
    const updatedSuggestion = await resolveRemediationSuggestion(suggestionId);

    return NextResponse.json({ suggestion: updatedSuggestion });
  } catch (error) {
    console.error('Error resolving remediation suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to resolve remediation suggestion' },
      { status: 500 }
    );
  }
}
