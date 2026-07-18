"use client";

import { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  SparklesIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpOnSquareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: (id: string) => void;
  isCollapsed?: boolean;
  toggleMobileSidebar?: () => void;
}

// Compact relative timestamp for the mono readout (e.g. "now", "3h", "2d").
function formatRelative(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return `${Math.floor(day / 7)}w`;
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isCollapsed = false,
  toggleMobileSidebar
}: ChatSidebarProps) {
  // Mobile sidebar state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLess, setShowLess] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle function for mobile
  const handleToggleMobile = () => {
    setMobileOpen(!mobileOpen);
    if (toggleMobileSidebar) {
      toggleMobileSidebar();
    }
  };

  // Close menu when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setActiveMenuId(null);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const confirmDelete = (id: string) => {
    if (!onDeleteConversation) return;
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      onDeleteConversation(id);
    }
  };

  // Shared dropdown menu (rename / share / delete) — single markup, reused desktop + mobile.
  const renderMenu = (id: string) => (
    <div
      ref={menuRef}
      className="absolute right-2 top-11 z-20 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <button
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setActiveMenuId(null);
        }}
      >
        <PencilIcon className="h-4 w-4" />
        Rename
      </button>
      <button
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setActiveMenuId(null);
        }}
      >
        <ArrowUpOnSquareIcon className="h-4 w-4" />
        Share
      </button>
      <div className="h-px bg-border" />
      <button
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation();
          confirmDelete(id);
          setActiveMenuId(null);
        }}
      >
        <TrashIcon className="h-4 w-4" />
        Delete
      </button>
    </div>
  );

  // One conversation row — single-accent active state via left border + tinted surface.
  const renderRow = (conversation: Conversation, onSelect: () => void) => {
    const isActive = activeConversationId === conversation.id;
    return (
      <div key={conversation.id} className="group relative">
        <div
          onClick={onSelect}
          className={`flex cursor-pointer items-center gap-2 border-l-2 py-2.5 pl-3 pr-2 transition-colors ${
            isActive
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:border-border hover:bg-accent'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm leading-tight ${
                isActive ? 'font-semibold text-foreground' : 'text-foreground/90'
              }`}
            >
              {conversation.title}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[0.65rem] text-muted-foreground">
                {formatRelative(conversation.timestamp)}
              </span>
              {conversation.lastMessage && (
                <span className="truncate text-[0.7rem] text-muted-foreground/70">
                  {conversation.lastMessage}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id);
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
            title="Conversation options"
          >
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>
        </div>

        {activeMenuId === conversation.id && renderMenu(conversation.id)}
      </div>
    );
  };

  const visibleConversations = showLess ? conversations.slice(0, 5) : conversations;

  return (
    <>
      {/* Desktop sidebar — collapsible */}
      <div
        className={`hidden h-full flex-col overflow-hidden border-r border-border bg-secondary/30 transition-all duration-300 md:flex ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {/* Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-border px-4 ${
            isCollapsed ? 'justify-center' : 'justify-start gap-2.5'
          }`}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/12">
            <SparklesIcon className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                StudyArc
              </p>
              <h2 className="font-display text-base font-bold leading-none tracking-tight text-foreground">
                AI Tutor
              </h2>
            </div>
          )}
        </div>

        {/* New Chat button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl brand-gradient px-4 py-2.5 font-semibold text-white shadow-button transition-all hover:brightness-110 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <PlusIcon className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm">New chat</span>}
          </button>
        </div>

        {/* Recent eyebrow */}
        {!isCollapsed && (
          <div className="px-4 pb-2 pt-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Recent
            </span>
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {conversations.length > 0 ? (
            isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectConversation(c.id)}
                    className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                      activeConversationId === c.id
                        ? 'bg-primary/12 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                    title={c.title}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/60 px-1">
                {visibleConversations.map((c) => renderRow(c, () => onSelectConversation(c.id)))}

                {conversations.length > 5 && (
                  <button
                    onClick={() => setShowLess(!showLess)}
                    className="flex w-full items-center justify-center gap-1.5 py-3 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showLess ? (
                      <>
                        Show all {conversations.length} <ChevronDownIcon className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Show less <ChevronUpIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          ) : (
            !isCollapsed && (
              <div className="px-4 py-8 text-center">
                <p className="font-mono text-[0.7rem] text-muted-foreground">No conversations yet</p>
              </div>
            )
          )}
        </div>

        {/* Settings */}
        {!isCollapsed && (
          <div className="mt-auto border-t border-border p-3">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Cog6ToothIcon className="h-5 w-5" />
              Settings and help
            </button>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={handleToggleMobile}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-80 transform overflow-hidden border-r border-border bg-card transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/30 bg-primary/12">
                <SparklesIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  StudyArc
                </p>
                <h2 className="font-display text-base font-bold leading-none tracking-tight text-foreground">
                  AI Tutor
                </h2>
              </div>
            </div>
            <button
              onClick={handleToggleMobile}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat button */}
          <div className="p-3">
            <button
              onClick={() => {
                if (onNewChat) {
                  onNewChat();
                  handleToggleMobile();
                }
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl brand-gradient px-4 py-2.5 font-semibold text-white shadow-button transition-all hover:brightness-110"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="text-sm">New chat</span>
            </button>
          </div>

          {/* Recent eyebrow */}
          <div className="px-4 pb-2 pt-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Recent
            </span>
          </div>

          {/* Conversations list */}
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {conversations.length > 0 ? (
              <div className="divide-y divide-border/60 px-1">
                {visibleConversations.map((c) =>
                  renderRow(c, () => {
                    onSelectConversation(c.id);
                    handleToggleMobile();
                  })
                )}

                {conversations.length > 5 && (
                  <button
                    onClick={() => setShowLess(!showLess)}
                    className="flex w-full items-center justify-center gap-1.5 py-3 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showLess ? (
                      <>
                        Show all {conversations.length} <ChevronDownIcon className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Show less <ChevronUpIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="font-mono text-[0.7rem] text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="mt-auto border-t border-border p-3">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Cog6ToothIcon className="h-5 w-5" />
              Settings and help
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
