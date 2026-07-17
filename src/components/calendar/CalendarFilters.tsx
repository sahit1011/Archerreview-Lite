'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  topics: any[];
  topicsLoading: boolean;
}

export interface FilterOptions {
  taskTypes: string[];
  taskStatuses: string[];
  topicIds: string[];
  hideCompleted: boolean;
}

export default function CalendarFilters({
  onFilterChange,
  initialFilters,
  topics,
  topicsLoading
}: CalendarFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      taskTypes: [],
      taskStatuses: [],
      topicIds: [],
      hideCompleted: false
    }
  );

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handle task type filter change
  const handleTaskTypeChange = (type: string) => {
    setFilters(prev => {
      const newTaskTypes = prev.taskTypes.includes(type)
        ? prev.taskTypes.filter(t => t !== type)
        : [...prev.taskTypes, type];

      return { ...prev, taskTypes: newTaskTypes };
    });
  };

  // Handle task status filter change
  const handleTaskStatusChange = (status: string) => {
    setFilters(prev => {
      const newTaskStatuses = prev.taskStatuses.includes(status)
        ? prev.taskStatuses.filter(s => s !== status)
        : [...prev.taskStatuses, status];

      return { ...prev, taskStatuses: newTaskStatuses };
    });
  };

  // Handle topic filter change
  const handleTopicChange = (topicId: string) => {
    setFilters(prev => {
      const newTopicIds = prev.topicIds.includes(topicId)
        ? prev.topicIds.filter(id => id !== topicId)
        : [...prev.topicIds, topicId];

      return { ...prev, topicIds: newTopicIds };
    });
  };

  // Handle hide completed toggle
  const handleHideCompletedChange = () => {
    setFilters(prev => ({
      ...prev,
      hideCompleted: !prev.hideCompleted
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      taskTypes: [],
      taskStatuses: [],
      topicIds: [],
      hideCompleted: false
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.taskTypes.length > 0 ||
      filters.taskStatuses.length > 0 ||
      filters.topicIds.length > 0 ||
      filters.hideCompleted
    );
  };

  // Get the count of active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.taskTypes.length > 0) count++;
    if (filters.taskStatuses.length > 0) count++;
    if (filters.topicIds.length > 0) count++;
    if (filters.hideCompleted) count++;
    return count;
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm transition-all mb-4 overflow-hidden">
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </span>
          <h3 className="font-semibold text-foreground flex items-center">
            Calendar Filters
            {hasActiveFilters() && (
              <span className="ml-2 bg-primary/12 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center">
          {hasActiveFilters() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-sm text-muted-foreground hover:text-foreground mr-3 transition-colors"
            >
              Clear
            </button>
          )}
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <div className="overflow-hidden"> {/* Moved className here */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              // className="overflow-hidden" // Removed from here
            >
              <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 border-t border-border">
                {/* Task Type Filter */}
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Task Type</h4>
                <div className="space-y-2.5">
                  {['QUIZ', 'VIDEO', 'READING', 'PRACTICE', 'REVIEW', 'OVERLOADED'].map((type) => (
                    <label key={type} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.taskTypes.includes(type)}
                        onChange={() => handleTaskTypeChange(type)}
                        className="h-4 w-4 accent-[var(--primary)] rounded border-border focus:ring-ring"
                      />
                      <span className="ml-2 text-sm text-muted-foreground capitalize group-hover:text-foreground transition-colors">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Task Status Filter */}
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Task Status</h4>
                <div className="space-y-2.5">
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].map((status) => (
                    <label key={status} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.taskStatuses.includes(status)}
                        onChange={() => handleTaskStatusChange(status)}
                        className="h-4 w-4 accent-[var(--primary)] rounded border-border focus:ring-ring"
                      />
                      <span className="ml-2 text-sm text-muted-foreground capitalize group-hover:text-foreground transition-colors">
                        {status === 'IN_PROGRESS' ? 'In Progress' : status.toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topic Filter */}
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Topics</h4>
                {topicsLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">Loading topics...</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2">
                    {topics.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No topics available</p>
                    ) : (
                      topics.map((topic) => (
                        <label key={topic._id} className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.topicIds.includes(topic._id)}
                            onChange={() => handleTopicChange(topic._id)}
                            className="h-4 w-4 accent-[var(--primary)] rounded border-border focus:ring-ring"
                          />
                          <span className="ml-2 text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors" title={topic.name}>
                            {topic.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Options</h4>
                <div className="space-y-2.5">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.hideCompleted}
                      onChange={handleHideCompletedChange}
                      className="h-4 w-4 accent-[var(--primary)] rounded border-border focus:ring-ring"
                    />
                    <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">Hide completed tasks</span>
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div> {/* This closes "Additional Options" div */}
              </div> {/* This closes the "p-4 grid..." div */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
