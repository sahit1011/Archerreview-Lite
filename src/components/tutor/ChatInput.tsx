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
        <div className="flex items-end w-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <div className="flex-grow relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI tutor anything about NCLEX..."
              className="w-full px-6 py-4 bg-transparent focus:outline-none resize-none min-h-[56px] max-h-32 text-white placeholder-gray-400 text-base leading-relaxed"
              rows={1}
              disabled={isLoading}
            />

            <div className="absolute right-4 bottom-4 flex items-center space-x-3">
              <button
                type="button"
                className="p-2 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                disabled={isLoading}
                title="Voice input (coming soon)"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="p-2 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                disabled={isLoading}
                title="Attach image (coming soon)"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>

              <button
                type="submit"
                className={`p-3 rounded-full transition-all duration-200 ${
                  message.trim() && !isLoading
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
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
        <div className="text-xs text-gray-400 flex items-center bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 flex-shrink-0 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>AI responses may contain inaccuracies</span>
        </div>
      </div>
    </div>
  );
}
