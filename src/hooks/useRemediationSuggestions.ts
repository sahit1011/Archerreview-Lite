import { useState, useEffect, useCallback } from 'react';

interface RemediationSuggestion {
  _id: string;
  type: 'REMEDIATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  createdAt: string;
  metadata: {
    remediationType: 'CONCEPT_REVIEW' | 'PRACTICE_QUESTIONS' | 'VIDEO_TUTORIAL' | 'STUDY_TECHNIQUE' | 'AI_TUTOR_SESSION';
    title: string;
    suggestedAction: string;
    aiPrompt: string;
    topicName?: string;
    resourceId?: string;
    resourceTitle?: string;
    resourceType?: string;
  };
  relatedTopic?: {
    _id: string;
    name: string;
  };
}

interface UseRemediationSuggestionsResult {
  remediationSuggestions: RemediationSuggestion[];
  loading: boolean;
  error: string | null;
  fetchRemediationSuggestions: () => Promise<void>;
  generateRemediationSuggestions: () => Promise<void>;
  resolveSuggestion: (suggestionId: string) => Promise<void>;
}

export function useRemediationSuggestions(): UseRemediationSuggestionsResult {
  const [suggestions, setSuggestions] = useState<RemediationSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch remediation suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!userId) {
      console.warn('No user ID available for fetching remediation suggestions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching remediation suggestions for user: ${userId}`);
      const response = await fetch(`/api/remediation?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch remediation suggestions');
      }

      const data = await response.json();
      console.log('Received remediation suggestions:', data);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error fetching remediation suggestions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Generate new remediation suggestions
  const generateSuggestions = useCallback(async () => {
    if (!userId) {
      console.warn('No user ID available for generating remediation suggestions');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Generating remediation suggestions for user: ${userId}`);
      const response = await fetch('/api/remediation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limiting
        if (response.status === 429) {
          console.log('Rate limited. Skipping remediation suggestion generation.');
          setError('Rate limited. Please try again later.');
          return;
        }

        throw new Error(errorData.error || 'Failed to generate remediation suggestions');
      }

      const data = await response.json();
      console.log('Generated remediation suggestion:', data);

      // Fetch the updated suggestions
      await fetchSuggestions();
    } catch (err) {
      console.error('Error generating remediation suggestions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchSuggestions]);

  // Resolve a remediation suggestion
  const resolveSuggestion = useCallback(async (suggestionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/remediation/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve remediation suggestion');
      }

      // Update the local state
      setSuggestions(prev => prev.filter(s => s._id !== suggestionId));
    } catch (err) {
      console.error('Error resolving remediation suggestion:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suggestions when userId is available
  useEffect(() => {
    if (userId) {
      fetchSuggestions();
    }
  }, [userId, fetchSuggestions]);

  return {
    remediationSuggestions: suggestions,
    loading,
    error,
    fetchRemediationSuggestions: fetchSuggestions,
    generateRemediationSuggestions: generateSuggestions,
    resolveSuggestion,
  };
}
