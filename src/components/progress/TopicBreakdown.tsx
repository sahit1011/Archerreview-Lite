'use client';

import { useState } from 'react';
import { Layers, ChevronRight } from 'lucide-react';

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
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-success';
    if (score >= 70) return 'bg-primary';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  // Get text color based on score
  const getTextColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 70) return 'text-primary';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
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
          className={`flex items-center justify-between rounded-xl border border-border p-4 transition-all ${depth === 0 ? 'bg-secondary/50' : 'bg-secondary/30'} ${hasSubtopics ? 'cursor-pointer hover:bg-accent' : ''}`}
          onClick={() => hasSubtopics && toggleTopic(topic._id)}
        >
          <div className="flex items-center">
            {hasSubtopics && (
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            )}
            <div>
              <div className="font-medium text-foreground">{topic.name}</div>
              {depth === 0 && (
                <div className="mt-1 text-xs text-muted-foreground">{formatCategoryName(topic.category)}</div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {topic.score !== undefined && (
              <span className={`mr-3 rounded-lg bg-muted px-3 py-1 text-sm font-semibold ${getTextColor(topic.score)}`}>
                {topic.score}%
              </span>
            )}
            <div className="h-3 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className={`${getScoreColor(topic.score)} h-3 rounded-full`}
                style={{ width: `${topic.score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {hasSubtopics && isExpanded && (
          <div className="ml-4 mt-3 border-l-2 border-border pl-8">
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
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Topic Breakdown</h2>
      </div>

      <div className="space-y-6">
        {Object.entries(topicsByCategory).map(([category, categoryTopics]) => (
          <div key={category} className="rounded-xl border border-border bg-secondary/30 p-5">
            <h3 className="mb-4 border-b border-border pb-2 text-base font-semibold text-primary">
              {formatCategoryName(category)}
            </h3>
            {categoryTopics.map(topic => renderTopic(topic))}
          </div>
        ))}
      </div>
    </div>
  );
}
