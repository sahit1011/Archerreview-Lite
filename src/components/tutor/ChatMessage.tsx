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
  const [showSummary, setShowSummary] = useState(false);

  const isUser = role === 'user';
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(timestamp));

  // Generate a simple summary of long responses
  const getSummary = (text: string): string => {
    // Extract key points from the response
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, 3).map(s => s.trim());

    return `📋 **Summary:**\n${keyPoints.map(point => `• ${point}`).join('\n')}\n\n💡 *Click "Show full" to see complete response*`;
  };

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`mb-6 last:mb-2 ${isUser ? 'flex justify-end' : 'flex justify-start'}`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message header */}
        <div className={`flex items-center mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="text-xs text-gray-400 font-medium">
            {isUser ? 'You' : 'AI Tutor'}
          </div>
          <div className="text-xs text-gray-500 ml-2">
            {formattedTime}
          </div>
        </div>

        {/* Message content */}
        <div className={`relative group ${isUser ? 'ml-auto' : 'mr-auto'}`}>
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
              isUser
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-400/30 rounded-br-md'
                : 'bg-white/10 text-white border-white/20 rounded-bl-md'
            }`}
          >
            <div className={`${content.length > 500 && !isExpanded ? 'line-clamp-6' : ''} text-sm leading-relaxed`}>
              {showSummary && !isUser ? getSummary(content) : formatMessage(content)}
            </div>

            {content.length > 500 && !isUser && (
              <div className="mt-2 flex items-center space-x-2">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="text-xs font-medium text-blue-300 hover:text-blue-200 transition-colors"
                >
                  {showSummary ? 'Show full' : 'Show summary'}
                </button>
                <span className="text-gray-500">•</span>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}

            {content.length > 500 && isUser && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-medium text-indigo-200 hover:text-white transition-colors"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Message actions for AI responses */}
          {!isUser && (
            <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Copy message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Regenerate response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
