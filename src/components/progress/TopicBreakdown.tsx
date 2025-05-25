'use client';

import { useState } from 'react';

interface Topic {
  _id: string;
  name: string;
  category: string;
  score?: number;
  subtopics?: Topic[];
}

interface TopicBreakdownProps {
  topics: Topic[];
}

export default function TopicBreakdown({ topics }: TopicBreakdownProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Toggle topic expansion
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Get score color based on score
  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-archer-light-blue';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get text color based on score
  const getTextColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-archer-light-blue';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Render a topic and its subtopics recursively
  const renderTopic = (topic: Topic, depth = 0) => {
    const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
    const isExpanded = expandedTopics[topic._id];

    return (
      <div key={topic._id} className="mb-3">
        <div
          className={`flex items-center justify-between p-4 rounded-lg ${depth === 0 ? 'bg-card-background-light' : 'bg-light-bg-secondary'} cursor-pointer shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-border-color-light`}
          onClick={() => hasSubtopics && toggleTopic(topic._id)}
        >
          <div className="flex items-center">
            {hasSubtopics && (
              <div className="w-8 h-8 rounded-full bg-light-bg-secondary flex items-center justify-center mr-3 shadow-button">
                <svg
                  className={`h-5 w-5 text-archer-dark-text transform ${isExpanded ? 'rotate-90' : ''} transition-transform`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
            <div>
              <div className="font-medium text-archer-dark-text">{topic.name}</div>
              {depth === 0 && (
                <div className="text-xs text-gray-500 mt-1">{formatCategoryName(topic.category)}</div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {topic.score !== undefined && (
              <span className={`text-sm font-medium ${getTextColor(topic.score)} px-3 py-1 bg-gray-100 rounded-lg shadow-button mr-3`}>
                {topic.score}%
              </span>
            )}
            <div className="w-20 bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className={`${getScoreColor(topic.score)} h-3 rounded-full shadow-button`}
                style={{ width: `${topic.score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {hasSubtopics && isExpanded && (
          <div className="pl-8 mt-3 border-l-2 border-gray-200 ml-4">
            {topic.subtopics!.map(subtopic => renderTopic(subtopic, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group topics by category
  const topicsByCategory: Record<string, Topic[]> = {};
  topics.forEach(topic => {
    if (!topicsByCategory[topic.category]) {
      topicsByCategory[topic.category] = [];
    }
    topicsByCategory[topic.category].push(topic);
  });

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <h2 className="text-xl font-semibold text-archer-dark-text mb-6">Topic Breakdown</h2>

      <div className="space-y-8">
        {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
          <div key={category} className="space-y-3 bg-light-bg-secondary p-5 rounded-lg shadow-card border border-border-color-light">
            <h3 className="text-lg font-medium text-archer-bright-teal mb-4 border-b border-gray-200 pb-2">
              {formatCategoryName(category)}
            </h3>
            {categoryTopics.map(topic => renderTopic(topic))}
          </div>
        ))}
      </div>
    </div>
  );
}
