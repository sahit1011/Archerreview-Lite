"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export interface ChatMessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isUser = role === 'user';
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(timestamp));

  // Format code blocks in the message
  const formatMessage = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match?.[1] || '';
        const code = match?.[2] || '';

        return (
          <div key={index} className="my-2 rounded-md overflow-hidden">
            {language && (
              <div className="bg-gray-800 text-gray-300 text-xs px-4 py-1">
                {language}
              </div>
            )}
            <pre className="bg-gray-900 p-4 overflow-x-auto text-gray-100 text-sm">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Process regular text with line breaks
      return (
        <div key={index} className="whitespace-pre-wrap">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="mb-8 last:mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Message header with avatar and role */}
        <div className="flex items-center mb-3">
          <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center mr-3 shadow-card`}
               style={{ backgroundColor: isUser ? 'rgba(0, 169, 157, 0.2)' : 'rgba(66, 176, 232, 0.2)' }}>
            {isUser ? (
              <div className="h-9 w-9 rounded-full text-white flex items-center justify-center font-semibold shadow-card bg-archer-bright-teal">
                U
              </div>
            ) : (
              <SparklesIcon className="h-5 w-5 text-archer-light-blue" />
            )}
          </div>
          <div className="text-sm font-semibold text-white">
            {isUser ? 'You' : 'AI Tutor'}
          </div>
          <div className="text-xs text-archer-light-text/70 ml-2">
            {formattedTime}
          </div>
        </div>

        {/* Message content */}
        <div className="pl-12">
          <div
            className={`${content.length > 300 && !isExpanded ? 'line-clamp-5' : ''} p-5 rounded-xl text-white shadow-card`}
            style={{
              backgroundColor: isUser ? 'var(--card-background-dark)' : 'var(--card-background-darker)',
              borderLeft: isUser ? '4px solid var(--archer-bright-teal)' : '4px solid var(--archer-light-blue)'
            }}>
            {formatMessage(content)}
          </div>

          {content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm font-medium text-archer-light-blue hover:text-archer-bright-teal transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {/* Only show for AI messages */}
          {!isUser && (
            <div className="mt-3 flex space-x-3">
              <button className="text-archer-dark-teal p-2 rounded-full bg-archer-bright-teal hover:bg-archer-bright-teal/90 shadow-button hover:shadow-card-hover transform hover:-translate-y-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="text-archer-dark-teal p-2 rounded-full bg-archer-bright-teal hover:bg-archer-bright-teal/90 shadow-button hover:shadow-card-hover transform hover:-translate-y-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
              <button className="text-archer-dark-teal p-2 rounded-full bg-archer-bright-teal hover:bg-archer-bright-teal/90 shadow-button hover:shadow-card-hover transform hover:-translate-y-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
