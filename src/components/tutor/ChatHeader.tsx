"use client";

import { SparklesIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onNewChat: () => void;
}

export default function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-card/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/12">
            <SparklesIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              StudyArc
            </p>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base font-bold leading-none tracking-tight text-foreground">
                AI Tutor
              </h1>
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="brand" size="sm" onClick={onNewChat} className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            New chat
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <InformationCircleIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
