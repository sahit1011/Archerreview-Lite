"use client";

import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onNewChat: () => void;
}

export default function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center mr-3">
            <SparklesIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">AI Tutor</h1>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-success mr-2"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="brand" size="sm" onClick={onNewChat} className="rounded-full">
            New Chat
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
            <InformationCircleIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 bg-primary/10 text-sm text-muted-foreground flex items-center border-t border-border">
        <InformationCircleIcon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
        <p>I&apos;m your NEET/JEE AI Tutor. Ask me about Physics, Chemistry, Biology &amp; Mathematics, practice problems, or study strategies.</p>
      </div>
    </div>
  );
}
