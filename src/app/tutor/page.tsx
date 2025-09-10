"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import ChatInterface from '@/components/tutor/ChatInterface';
import ClientOnly from '@/components/common/ClientOnly';
import ParticleBackground from '@/components/common/ParticleBackground';

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
      <div className="h-full w-full overflow-hidden relative">
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 -z-10"></div>
        <div className="relative z-0 text-white h-full">
          {/* Enhanced Particle Background */}
          <ClientOnly>
            <ParticleBackground
              particleCount={60}
              colors={['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#0EA5E9']}
              className="opacity-40"
            />
          </ClientOnly>

          <div className="h-full">
            <ChatInterface userId={userId} initialPrompt={initialPrompt} conversationTitle={conversationTitle} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
