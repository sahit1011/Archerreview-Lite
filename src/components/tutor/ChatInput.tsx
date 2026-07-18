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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end w-full bg-card backdrop-blur-md rounded-2xl border border-border shadow-sm overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-ring transition-colors">
          <div className="flex-grow relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI tutor anything about NEET/JEE..."
              className="w-full px-6 py-4 bg-transparent focus:outline-none resize-none min-h-[56px] max-h-32 text-foreground placeholder:text-muted-foreground text-base leading-relaxed"
              rows={1}
              disabled={isLoading}
            />

            <div className="absolute right-4 bottom-4 flex items-center space-x-3">
              <button
                type="button"
                className="p-2 text-muted-foreground rounded-full hover:bg-accent hover:text-foreground transition-all disabled:opacity-50"
                disabled={isLoading}
                title="Voice input (coming soon)"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="p-2 text-muted-foreground rounded-full hover:bg-accent hover:text-foreground transition-all disabled:opacity-50"
                disabled={isLoading}
                title="Attach image (coming soon)"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <button
                type="submit"
                className={`p-3 rounded-full transition-all duration-200 ${
                  message.trim() && !isLoading
                    ? 'brand-gradient text-white shadow-button hover:brightness-110'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-center mt-3">
        <div className="text-xs text-muted-foreground flex items-center bg-secondary px-3 py-1 rounded-full backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 flex-shrink-0 text-warning" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>AI responses may contain inaccuracies</span>
        </div>
      </div>
    </div>
  );
}
