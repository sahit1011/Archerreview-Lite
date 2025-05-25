"use client";

import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  onNewChat: () => void;
}

export default function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">AI Tutor</h1>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewChat}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            New Chat
          </motion.button>

          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <InformationCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 bg-indigo-50 text-sm text-indigo-700 flex items-center">
        <InformationCircleIcon className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
        <p>I'm your NCLEX AI Tutor. Ask me questions about nursing concepts, practice questions, or study strategies.</p>
      </div>
    </div>
  );
}
