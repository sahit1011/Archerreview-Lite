"use client";

import { useState, useRef, useEffect } from 'react';
import { PlusIcon, ChatBubbleLeftRightIcon, XMarkIcon, Bars3Icon, SparklesIcon, EllipsisHorizontalIcon, HeartIcon, PencilIcon, TrashIcon, ArrowUpOnSquareIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';

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

  return (
    <>
      {/* Desktop sidebar toggle button - removed from here */}

      {/* Desktop sidebar - collapsible */}
      <div
        className={`hidden md:flex flex-col h-full transition-all duration-300 overflow-hidden bg-gray-900/50 backdrop-blur-sm border-r border-white/10 ${isCollapsed ? 'w-16' : 'w-72'}`}
      >
        {/* Sidebar header - always visible */}
        <div className={`p-5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/10 sticky top-0 z-10 glassmorphic`}>
          {isCollapsed ? (
            <SparklesSolidIcon className="h-6 w-6 text-archer-bright-teal" />
          ) : (
            <>
              <div className="flex items-center">
                <SparklesSolidIcon className="h-6 w-6 mr-2 text-indigo-400" />
                <h2 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Tutor</h2>
              </div>
            </>
          )}
        </div>

        {/* New Chat Button - with more spacing */}
        <div className="px-4 py-4 mt-4">
          <div
            onClick={onNewChat}
            className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all w-full cursor-pointer bg-indigo-500/20 hover:bg-indigo-500/30 transform hover:-translate-y-1 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <PlusIcon className="h-5 w-5 text-indigo-400" />
            {!isCollapsed && <span className="font-semibold text-white">New chat</span>}
          </div>
        </div>

        {/* Recent label - with more spacing */}
        {!isCollapsed && (
          <div className="px-5 py-4 mt-6 text-sm font-semibold text-gray-300">
            Recent
          </div>
        )}

        {/* Conversations list */}
        <div className="flex-grow overflow-y-auto px-3 mt-2 pb-4">
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {(showLess ? conversations.slice(0, 5) : conversations).map((conversation) => (
                <div key={conversation.id} className="relative group mb-3">
                  <div
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`w-full text-left py-3 px-4 rounded-lg transition-all flex items-center justify-between cursor-pointer hover:bg-white/10 transform hover:-translate-y-1 ${activeConversationId === conversation.id ? 'text-indigo-300 font-semibold bg-indigo-500/30' : 'text-white'} ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    {isCollapsed ? (
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    ) : (
                      <>
                        <div className="truncate pr-6">{conversation.title}</div>
                        <div className="flex items-center">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Delete button clicked directly for conversation:', conversation.id);
                              if (onDeleteConversation) {
                                if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                                  onDeleteConversation(conversation.id);
                                }
                              }
                            }}
                            className="opacity-100 p-1 rounded-full hover:bg-archer-bright-teal/20 cursor-pointer mr-1"
                          >
                            <TrashIcon className="h-5 w-5 text-red-400" />
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Menu button clicked for conversation:', conversation.id);
                              setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id);
                            }}
                            className="opacity-100 p-1 rounded-full hover:bg-archer-bright-teal/20 cursor-pointer"
                          >
                            <EllipsisHorizontalIcon className="h-5 w-5 text-archer-light-blue" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dropdown menu for conversation options */}
                  {activeMenuId === conversation.id && !isCollapsed && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-12 z-10 glassmorphic-strong rounded-lg shadow-xl w-48 overflow-hidden border border-white/20"
                    >
                      <div className="py-1">
                        <button
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Rename logic would go here
                            setActiveMenuId(null);
                          }}
                        >
                          <PencilIcon className="h-4 w-4 text-indigo-400" />
                          Rename
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Share logic would go here
                            setActiveMenuId(null);
                          }}
                        >
                          <ArrowUpOnSquareIcon className="h-4 w-4 text-indigo-400" />
                          Share
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete button clicked for conversation:', conversation.id);
                            console.log('onDeleteConversation function exists:', !!onDeleteConversation);
                            if (onDeleteConversation) {
                              // Confirm before deleting
                              console.log('Showing confirmation dialog');
                              const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
                              console.log('User confirmed deletion:', confirmed);
                              if (confirmed) {
                                console.log('Calling onDeleteConversation with ID:', conversation.id);
                                onDeleteConversation(conversation.id);
                              }
                            }
                            setActiveMenuId(null);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Show more/less button */}
              {!isCollapsed && conversations.length > 5 && (
                <div
                  onClick={() => setShowLess(!showLess)}
                  className="flex items-center gap-2 w-full text-left py-2 px-3 text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer mt-3"
                >
                  {showLess ? (
                    <>
                      <span>Show more</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Show less</span>
                      <ChevronUpIcon className="h-4 w-4" />
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center text-gray-400 py-4 ${isCollapsed ? 'hidden' : ''}`}>
              No conversations yet
            </div>
          )}
        </div>

        {/* Settings section */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-white/10">
            <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all w-full cursor-pointer hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-white">Settings and help</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar toggle button - removed from here */}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={handleToggleMobile}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out overflow-hidden glassmorphic-strong ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-5 flex items-center justify-between border-b border-white/10 sticky top-0 z-10 glassmorphic">
            <div className="flex items-center">
              <SparklesSolidIcon className="h-6 w-6 mr-2 text-indigo-400" />
              <h2 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Tutor</h2>
            </div>
            <button
              onClick={handleToggleMobile}
              className="text-gray-300 hover:text-white p-1 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 py-4 mt-4">
            <div
              onClick={() => {
                if (onNewChat) {
                  onNewChat();
                  handleToggleMobile(); // Close sidebar after creating new chat
                }
              }}
              className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all w-full cursor-pointer glassmorphic hover:bg-white/10 transform hover:-translate-y-1"
            >
              <PlusIcon className="h-5 w-5 text-indigo-400" />
              <span className="font-semibold text-white">New chat</span>
            </div>
          </div>

          {/* Recent label */}
          <div className="px-5 py-4 mt-6 text-sm font-semibold text-gray-300">
            Recent
          </div>

          {/* Conversations list */}
          <div className="flex-grow overflow-y-auto px-3 mt-2 pb-4">
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {(showLess ? conversations.slice(0, 5) : conversations).map((conversation) => (
                  <div key={conversation.id} className="relative group mb-3">
                    <div
                      onClick={() => {
                        onSelectConversation(conversation.id);
                        handleToggleMobile(); // Close sidebar after selection on mobile
                      }}
                      className={`w-full text-left py-3 px-4 rounded-lg transition-all flex items-center justify-between cursor-pointer glassmorphic hover:bg-white/10 transform hover:-translate-y-1 ${
                        activeConversationId === conversation.id
                          ? 'text-indigo-400 font-semibold bg-indigo-500/20 border border-indigo-400/30'
                          : 'text-white'
                      }`}
                    >
                      <div className="truncate pr-6">{conversation.title}</div>
                      <div className="flex items-center">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Mobile: Delete button clicked directly for conversation:', conversation.id);
                            if (onDeleteConversation) {
                              if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                                onDeleteConversation(conversation.id);
                              }
                            }
                          }}
                          className="opacity-100 p-1 rounded-full hover:bg-archer-bright-teal/20 cursor-pointer mr-1"
                        >
                          <TrashIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Mobile: Menu button clicked for conversation:', conversation.id);
                            setActiveMenuId(activeMenuId === conversation.id ? null : conversation.id);
                          }}
                          className="opacity-100 p-1 rounded-full hover:bg-archer-bright-teal/20 cursor-pointer"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5 text-archer-light-blue" />
                        </div>
                      </div>
                    </div>

                    {/* Dropdown menu for conversation options */}
                    {activeMenuId === conversation.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-2 top-12 z-10 glassmorphic-strong rounded-lg shadow-xl w-48 overflow-hidden border border-white/20"
                      >
                        <div className="py-1">
                          <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Rename logic would go here
                              setActiveMenuId(null);
                            }}
                          >
                            <PencilIcon className="h-4 w-4 text-indigo-400" />
                            Rename
                          </button>
                          <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Share logic would go here
                              setActiveMenuId(null);
                            }}
                          >
                            <ArrowUpOnSquareIcon className="h-4 w-4 text-indigo-400" />
                            Share
                          </button>
                          <button
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Mobile: Delete button clicked for conversation:', conversation.id);
                              console.log('Mobile: onDeleteConversation function exists:', !!onDeleteConversation);
                              if (onDeleteConversation) {
                                // Confirm before deleting
                                console.log('Mobile: Showing confirmation dialog');
                                const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
                                console.log('Mobile: User confirmed deletion:', confirmed);
                                if (confirmed) {
                                  console.log('Mobile: Calling onDeleteConversation with ID:', conversation.id);
                                  onDeleteConversation(conversation.id);
                                }
                              }
                              setActiveMenuId(null);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show more/less button */}
                {conversations.length > 5 && (
                  <div
                    onClick={() => setShowLess(!showLess)}
                    className="flex items-center gap-2 w-full text-left py-2 px-3 text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer mt-3"
                  >
                    {showLess ? (
                      <>
                        <span>Show more</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Show less</span>
                        <ChevronUpIcon className="h-4 w-4" />
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                No conversations yet
              </div>
            )}
          </div>

          {/* Settings section */}
          <div className="mt-auto p-4 border-t border-white/10">
            <div
              className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all w-full cursor-pointer glassmorphic hover:bg-white/10 transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-white">Settings and help</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
