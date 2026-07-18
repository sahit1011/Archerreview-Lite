"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { SparklesIcon, UserIcon, ClipboardIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface ChatMessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — fail quietly, no UI change.
    }
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
          <div
            key={index}
            className="my-3 overflow-hidden rounded-lg border border-border bg-secondary/50"
          >
            <div className="flex items-center justify-between border-b border-border bg-secondary/70 px-3 py-1.5">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                {language || 'code'}
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed text-foreground">
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar glyph — hairline framed, single-accent for the tutor */}
      <div
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
          isUser
            ? 'border-border bg-secondary text-muted-foreground'
            : 'border-primary/30 bg-primary/12 text-primary'
        }`}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
      </div>

      <div className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message meta — uppercase role eyebrow + mono timestamp */}
        <div className={`mb-1.5 flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {isUser ? 'You' : 'AI Tutor'}
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground/70">{formattedTime}</span>
        </div>

        {/* Message content */}
        <div className="group relative">
          <div
            className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isUser
                ? 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground'
                : 'rounded-2xl rounded-tl-sm border border-border bg-card text-foreground'
            }`}
          >
            <div className={`${content.length > 500 && !isExpanded ? 'line-clamp-6' : ''}`}>
              {showSummary && !isUser ? getSummary(content) : formatMessage(content)}
            </div>

            {content.length > 500 && !isUser && (
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="font-mono text-[0.7rem] font-medium text-primary transition-colors hover:text-foreground"
                >
                  {showSummary ? 'Show full' : 'Show summary'}
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="font-mono text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}

            {content.length > 500 && isUser && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 font-mono text-[0.7rem] font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Message actions for AI responses */}
          {!isUser && (
            <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={copied ? 'Copied' : 'Copy message'}
              >
                {copied ? <CheckIcon className="h-4 w-4 text-primary" /> : <ClipboardIcon className="h-4 w-4" />}
              </button>
              <button
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Regenerate response"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
