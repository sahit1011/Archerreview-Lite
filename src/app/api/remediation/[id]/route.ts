import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { Alert } from '@/models';
import { resolveRemediationSuggestion } from '@/services/remediationService';

/**
 * PATCH /api/remediation/[id]
 * Mark a remediation suggestion as resolved
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    if (auth.response) return auth.response;
    const userId = auth.user.id; // TRUSTED, token-derived

    // Get the suggestion ID from the URL
    const { id: suggestionId } = await params;
    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      );
    }

    // Load the suggestion and verify it belongs to the authenticated user
    const existing = await Alert.findById(suggestionId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Remediation suggestion not found' },
        { status: 404 }
      );
    }
    if (existing.user.toString() !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
