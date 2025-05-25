"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicPriority {
  category: string;
  importance: 'High' | 'Medium' | 'Low';
}

interface TopicPriorityEditorProps {
  topics: TopicPriority[];
  onSave: (topics: TopicPriority[]) => void;
  onCancel: () => void;
}

// Helper function to get category display name
const getCategoryDisplayName = (category: string) => {
  const words = category.split('_');
  return words.map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

export default function TopicPriorityEditor({ 
  topics, 
  onSave, 
  onCancel 
}: TopicPriorityEditorProps) {
  const [editedTopics, setEditedTopics] = useState<TopicPriority[]>(topics);

  // Handle priority change
  const handlePriorityChange = (category: string, importance: 'High' | 'Medium' | 'Low') => {
    setEditedTopics(prev => 
      prev.map(topic => 
        topic.category === category 
          ? { ...topic, importance } 
          : topic
      )
    );
  };

  // Get color based on importance
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'High':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'Low':
        return 'bg-green-100 border-green-200 text-green-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Customize Topic Priorities</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Set the priority level for each topic based on your personal study needs. 
            High priority topics will receive more focus in your study plan.
          </p>

          <div className="space-y-4 mb-6">
            {editedTopics.map((topic) => (
              <div 
                key={topic.category}
                className={`p-4 rounded-lg border ${getImportanceColor(topic.importance)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="font-medium">{getCategoryDisplayName(topic.category)}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'High')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        topic.importance === 'High'
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                      }`}
                    >
                      High
                    </button>
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'Medium')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        topic.importance === 'Medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'Low')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        topic.importance === 'Low'
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                      }`}
                    >
                      Low
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedTopics)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Save Priorities
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
