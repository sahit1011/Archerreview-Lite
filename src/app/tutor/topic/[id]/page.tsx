'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TopicTutorSession from '@/components/tutor/TopicTutorSession';

export default function TopicTutorPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const urlUserId = searchParams.get('userId');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicExists, setTopicExists] = useState(false);

  // Verify that the topic exists
  useEffect(() => {
    const verifyTopic = async () => {
      if (!params.id) {
        setError('Topic ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/topics/${params.id}`);
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
  }, [params.id]);

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
        <TopicTutorSession
          userId={urlUserId || user?._id}
          topicId={params.id}
          initialPrompt={initialPrompt || undefined}
          onComplete={handleSessionComplete}
        />
      </div>
    </ProtectedRoute>
  );
}
