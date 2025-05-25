"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatInterface from '@/components/tutor/ChatInterface';

export default function TutorPage() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [conversationTitle, setConversationTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get userId from URL query parameter or localStorage
    const urlUserId = searchParams.get('userId');
    const localStorageUserId = localStorage.getItem('userId');

    // Get initial prompt from URL query parameter
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setInitialPrompt(urlPrompt);
    }

    // Get conversation title from URL query parameter
    const urlTitle = searchParams.get('title');
    if (urlTitle) {
      setConversationTitle(urlTitle);
    }

    if (urlUserId) {
      setUserId(urlUserId);
    } else if (localStorageUserId) {
      setUserId(localStorageUserId);
    }
  }, [searchParams]);

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-card-background-dark">
      <ChatInterface userId={userId} initialPrompt={initialPrompt} conversationTitle={conversationTitle} />
    </div>
  );
}
