'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopicTutorSession from '@/components/tutor/TopicTutorSession';

export default function TopicTutorPage() {
  const { user } = useUser();
  const params = useParams();
  const topicId = params?.id as string;
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const urlUserId = searchParams.get('userId');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicExists, setTopicExists] = useState(false);

  // Verify that the topic exists
  useEffect(() => {
    const verifyTopic = async () => {
      if (!topicId) {
        setError('Topic ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/topics/${topicId}`);
        if (response.ok) {
          setTopicExists(true);
        } else {
          setError('Topic not found');
        }
      } catch (err) {
        console.error('Error verifying topic:', err);
        setError('Failed to verify topic');
      } finally {
        setIsLoading(false);
      }
    };

    verifyTopic();
  }, [topicId]);

  // Handle session completion
  const handleSessionComplete = async (sessionData: any) => {
    console.log('Session completed:', sessionData);
    // Redirect back to the dashboard
    window.location.href = urlUserId ? `/dashboard?userId=${urlUserId}` : '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-foreground bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary"></div>
        <p className="text-sm text-muted-foreground">Loading topic…</p>
      </div>
    );
  }

  if (error || !topicExists) {
    return (
      <div className="flex items-center justify-center h-screen p-4 bg-background">
        <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-card backdrop-blur-sm shadow-sm p-8 max-w-md w-full">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/15 border border-destructive/30 mb-4">
            <span className="text-destructive text-2xl leading-none">!</span>
          </div>
          <div className="text-foreground font-semibold mb-1">
            {error || 'An error occurred'}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            We couldn&apos;t load this tutoring session. Please head back and try again.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-5 py-2.5 rounded-lg brand-gradient text-white font-semibold shadow-button hover:brightness-110 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen">
        <TopicTutorSession
          userId={urlUserId || (user as any)?._id}
          topicId={topicId}
          initialPrompt={initialPrompt || undefined}
          onComplete={handleSessionComplete}
        />
      </div>
    </ProtectedRoute>
  );
}
