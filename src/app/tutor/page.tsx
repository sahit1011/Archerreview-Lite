"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
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
    <AppLayout>
      {/* Bounded chat workspace: topbar (4rem) + main padding (~3.5rem) leaves the rest for chat */}
      <div className="h-[calc(100vh-8rem)] min-h-[30rem] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ChatInterface userId={userId} initialPrompt={initialPrompt} conversationTitle={conversationTitle} />
      </div>
    </AppLayout>
  );
}
