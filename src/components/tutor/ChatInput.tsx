"use client";

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-secondary/40 py-2 pl-3 pr-2 shadow-sm transition-colors focus-within:border-primary/40 focus-within:bg-card">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI tutor anything about NEET/JEE…"
            className="min-h-[40px] max-h-32 flex-grow resize-none bg-transparent py-2 text-[0.95rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            disabled={isLoading}
          />

          <div className="flex items-center gap-1 pb-1">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              disabled={isLoading}
              title="Voice input (coming soon)"
            >
              <MicrophoneIcon className="h-[18px] w-[18px]" />
            </button>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              disabled={isLoading}
              title="Attach image (coming soon)"
            >
              <PhotoIcon className="h-[18px] w-[18px]" />
            </button>

            <button
              type="submit"
              className={`grid h-9 w-9 place-items-center rounded-lg transition-all ${
                canSend
                  ? 'brand-gradient text-white shadow-button hover:brightness-110'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              }`}
              disabled={!canSend}
              title="Send"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              ) : (
                <PaperAirplaneIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-muted-foreground">
        <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        <span className="font-mono text-[0.65rem] tracking-tight">
          AI responses may contain inaccuracies · verify before your exam
        </span>
      </div>
    </div>
  );
}
