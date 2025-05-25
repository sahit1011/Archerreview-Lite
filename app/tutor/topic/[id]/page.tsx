'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopicTutorSession from '@/components/tutor/TopicTutorSession';

export default function TopicTutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const urlUserId = searchParams.get('userId');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicExists, setTopicExists] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);

  // Get the topic ID from params
  useEffect(() => {
    const getTopicId = async () => {
      try {
        const resolvedParams = await params;
        setTopicId(resolvedParams.id);
      } catch (err) {
        console.error('Error resolving params:', err);
        setError('Failed to get topic ID');
        setIsLoading(false);
      }
    };

    getTopicId();
  }, [params]);

  // Verify that the topic exists
  useEffect(() => {
    if (!topicId) return;

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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !topicExists) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">
          {error || 'An error occurred'}
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen">
        {topicId && (
          <TopicTutorSession
            userId={urlUserId || user?._id}
            topicId={topicId}
            initialPrompt={initialPrompt || undefined}
            onComplete={handleSessionComplete}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
