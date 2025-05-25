import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRemediationSuggestions } from './useRemediationSuggestions';

interface RemediationAgentResult {
  userId: string;
  planId: string;
  actions: any[];
  suggestions: any[];
  scheduledReviews: any[];
  tutorSessions: any[];
  summary: {
    totalActions: number;
    byType: Record<string, number>;
    byTopic: Record<string, number>;
  };
}

interface UseRemediationAgentResult {
  remediationSuggestions: any[];
  scheduledReviews: any[];
  tutorSessions: any[];
  loading: boolean;
  error: string | null;
  runRemediationAgent: () => Promise<void>;
  scheduleReviewSession: (topicId: string) => Promise<void>;
  startTutorSession: (prompt: string, topicName?: string) => void;
  resolveSuggestion: (suggestionId: string) => Promise<void>;
}

export function useRemediationAgent(userId?: string): UseRemediationAgentResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledReviews, setScheduledReviews] = useState<any[]>([]);
  const [tutorSessions, setTutorSessions] = useState<any[]>([]);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const router = useRouter();

  // Use the existing remediation suggestions hook
  const {
    remediationSuggestions,
    resolveSuggestion,
    generateRemediationSuggestions
  } = useRemediationSuggestions();

  // Get user ID from props or localStorage
  useEffect(() => {
    if (userId) {
      setEffectiveUserId(userId);
    } else {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setEffectiveUserId(storedUserId);
      }
    }
  }, [userId]);

  // Run the remediation agent
  const runRemediationAgent = useCallback(async () => {
    if (!effectiveUserId) {
      console.warn('No user ID available for running remediation agent');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Running remediation agent for user: ${effectiveUserId}`);
      const response = await fetch(`/api/remediation-agent?userId=${effectiveUserId}`);

      if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limiting
        if (response.status === 429) {
          console.log('Rate limited. Skipping remediation agent run.');
          setError('Rate limited. Please try again later.');
          return;
        }

        throw new Error(errorData.error || 'Failed to run remediation agent');
      }

      const data = await response.json();
      console.log('Remediation agent result:', data);

      // Update state with the result
      if (data.result) {
        setScheduledReviews(data.result.scheduledReviews || []);
        setTutorSessions(data.result.tutorSessions || []);
      }

      // Generate remediation suggestions if needed
      if (!remediationSuggestions.length) {
        await generateRemediationSuggestions();
      }
    } catch (err) {
      console.error('Error running remediation agent:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, generateRemediationSuggestions, remediationSuggestions.length]);

  // Schedule a review session
  const scheduleReviewSession = useCallback(async (topicId: string) => {
    if (!effectiveUserId) {
      console.warn('No user ID available for scheduling review session');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Scheduling review session for topic: ${topicId}`);
      const response = await fetch('/api/remediation-agent/schedule-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          topicId,
          source: 'USER_INITIATED'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule review session');
      }

      const data = await response.json();
      console.log('Scheduled review session:', data);

      // Update scheduled reviews if this is a new review
      if (data.task && !data.isExisting) {
        setScheduledReviews(prev => [...prev, {
          _id: data.task.id,
          title: data.task.title,
          startTime: new Date(data.task.startTime),
          endTime: new Date(data.task.endTime),
          duration: data.task.duration,
          topic: { _id: topicId }
        }]);
      }

      // Run the remediation agent to update everything
      await runRemediationAgent();
    } catch (err) {
      console.error('Error scheduling review session:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, runRemediationAgent]);

  // Start a tutor session
  const startTutorSession = useCallback((prompt: string, topicName?: string) => {
    // Create a conversation title based on the topic name
    const conversationTitle = topicName ? `Help with ${topicName}` : 'New Conversation';

    // Check if we have a valid userId
    if (!effectiveUserId) {
      console.error('No user ID available for starting tutor session');

      // Try to get userId from localStorage as fallback
      const localStorageUserId = localStorage.getItem('userId');

      if (localStorageUserId) {
        // Redirect with the localStorage userId
        router.push(`/tutor?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(conversationTitle)}&userId=${localStorageUserId}`);
      } else {
        // Redirect without userId as last resort
        router.push(`/tutor?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(conversationTitle)}`);
      }
      return;
    }

    // Redirect to the main tutor page with the prompt and conversation title
    router.push(`/tutor?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(conversationTitle)}&userId=${effectiveUserId}`);
  }, [router, effectiveUserId]);

  // Run the remediation agent when userId is available
  // But only fetch existing data, don't generate new suggestions automatically
  useEffect(() => {
    if (effectiveUserId) {
      // Instead of running the full agent, just fetch existing suggestions
      // This prevents excessive API calls on page load
      const fetchExistingData = async () => {
        try {
          // Get existing scheduled reviews
          const response = await fetch(`/api/tasks?userId=${effectiveUserId}&type=REVIEW&isRemediation=true`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setScheduledReviews(data.tasks || []);
            }
          }
        } catch (err) {
          console.error('Error fetching existing remediation data:', err);
        }
      };

      fetchExistingData();
    }
  }, [effectiveUserId]);

  return {
    remediationSuggestions,
    scheduledReviews,
    tutorSessions,
    loading,
    error,
    runRemediationAgent,
    scheduleReviewSession,
    startTutorSession,
    resolveSuggestion
  };
}
