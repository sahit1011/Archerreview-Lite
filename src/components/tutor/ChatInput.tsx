"use client";

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, PhotoIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-h-[120px]">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end w-full">
          <div className="flex-grow relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about NCLEX..."
              className="w-full border rounded-xl px-5 py-4 pr-28 focus:outline-none resize-none min-h-[52px] max-h-32 transition-all shadow-card text-archer-white placeholder-archer-light-text/50"
              style={{
                backgroundColor: 'var(--card-background-dark)',
                borderColor: 'var(--archer-medium-teal)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                minHeight: '52px'
              }}
              rows={1}
              disabled={isLoading}
            />

            <div className="absolute right-3 bottom-3 flex space-x-2">
              <button
                type="button"
                className="p-2 text-archer-dark-teal rounded-full bg-archer-bright-teal hover:bg-archer-bright-teal/90 transition-all shadow-button hover:shadow-card-hover transform hover:-translate-y-1"
                disabled={isLoading}
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="p-2 text-archer-dark-teal rounded-full bg-archer-bright-teal hover:bg-archer-bright-teal/90 transition-all shadow-button hover:shadow-card-hover transform hover:-translate-y-1"
                disabled={isLoading}
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <button
                type="submit"
                className={`p-2 rounded-full shadow-button hover:shadow-card-hover transform hover:-translate-y-1 transition-all ${
                  message.trim() && !isLoading
                    ? 'text-archer-dark-teal bg-archer-bright-teal hover:bg-archer-bright-teal/90'
                    : 'bg-archer-dark-teal/50 text-archer-light-text/50 cursor-not-allowed'
                }`}
                disabled={!message.trim() || isLoading}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-center mt-2">
        <div className="text-xs text-archer-light-text/70 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 text-archer-bright-teal" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="truncate">AI Tutor may display inaccurate info</span>
        </div>
      </div>
    </div>
  );
}
