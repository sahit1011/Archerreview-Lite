"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

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
  const words = category.replace(/_/g, ' ').toLowerCase().split(' ');
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
  const getImportanceColorClass = (importance: string) => {
    switch (importance) {
      case 'High':
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'Medium':
        return 'border-warning/30 bg-warning/10 text-warning';
      case 'Low':
        return 'border-primary/30 bg-primary/10 text-primary';
      default:
        return 'border-border bg-secondary text-muted-foreground';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card border border-border rounded-2xl shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Customize Topic Priorities</h2>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-muted-foreground mb-6">
            Set the priority level for each topic based on your personal study needs.
            High priority topics will receive more focus in your study plan.
          </p>

          <div className="space-y-4 mb-6">
            {editedTopics.map((topic) => (
              <div 
                key={topic.category}
                className={`p-4 rounded-lg border ${getImportanceColorClass(topic.importance)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="font-medium text-foreground">{getCategoryDisplayName(topic.category)}</div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'High')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        topic.importance === 'High'
                          ? 'bg-destructive text-primary-foreground shadow-sm'
                          : 'bg-secondary text-destructive hover:bg-muted'
                      }`}
                    >
                      High
                    </button>
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'Medium')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        topic.importance === 'Medium'
                          ? 'bg-warning text-primary-foreground shadow-sm'
                          : 'bg-secondary text-warning hover:bg-muted'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handlePriorityChange(topic.category, 'Low')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        topic.importance === 'Low'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-primary hover:bg-muted'
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
              className="px-6 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedTopics)}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium shadow-button hover:opacity-90 transition-opacity"
            >
              Save Priorities
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}