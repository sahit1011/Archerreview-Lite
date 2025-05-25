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
    <div className="bg-card-background-dark rounded-xl shadow-card hover:shadow-card-hover transition-all mb-4 overflow-hidden border border-border-color-dark">
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-archer-bright-teal mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="font-medium text-archer-light-text">
            Calendar Filters
            {hasActiveFilters() && (
              <span className="ml-2 bg-archer-bright-teal/20 text-archer-bright-teal text-xs font-medium px-2 py-0.5 rounded-full">
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
              className="text-sm text-archer-light-text/70 hover:text-archer-light-text mr-3"
            >
              Clear
            </button>
          )}
          <svg
            className={`w-5 h-5 text-archer-light-text/50 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Task Type Filter */}
              <div>
                <h4 className="text-sm font-medium text-archer-light-text mb-2">Task Type</h4>
                <div className="space-y-2">
                  {['QUIZ', 'VIDEO', 'READING', 'PRACTICE', 'REVIEW', 'OVERLOADED'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.taskTypes.includes(type)}
                        onChange={() => handleTaskTypeChange(type)}
                        className="h-4 w-4 text-archer-bright-teal border-border-color-dark rounded focus:ring-archer-bright-teal"
                      />
                      <span className="ml-2 text-sm text-archer-light-text/80 capitalize">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Task Status Filter */}
              <div>
                <h4 className="text-sm font-medium text-archer-light-text mb-2">Task Status</h4>
                <div className="space-y-2">
                  {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.taskStatuses.includes(status)}
                        onChange={() => handleTaskStatusChange(status)}
                        className="h-4 w-4 text-archer-bright-teal border-border-color-dark rounded focus:ring-archer-bright-teal"
                      />
                      <span className="ml-2 text-sm text-archer-light-text/80 capitalize">
                        {status === 'IN_PROGRESS' ? 'In Progress' : status.toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topic Filter */}
              <div>
                <h4 className="text-sm font-medium text-archer-light-text mb-2">Topics</h4>
                {topicsLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-t-2 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
                    <span className="text-sm text-archer-light-text/70">Loading topics...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-archer-dark-teal scrollbar-track-transparent">
                    {topics.length === 0 ? (
                      <p className="text-sm text-archer-light-text/70">No topics available</p>
                    ) : (
                      topics.map((topic) => (
                        <label key={topic._id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.topicIds.includes(topic._id)}
                            onChange={() => handleTopicChange(topic._id)}
                            className="h-4 w-4 text-archer-bright-teal border-border-color-dark rounded focus:ring-archer-bright-teal"
                          />
                          <span className="ml-2 text-sm text-archer-light-text/80 truncate" title={topic.name}>
                            {topic.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Additional Options */}
              <div>
                <h4 className="text-sm font-medium text-archer-light-text mb-2">Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hideCompleted}
                      onChange={handleHideCompletedChange}
                      className="h-4 w-4 text-archer-bright-teal border-border-color-dark rounded focus:ring-archer-bright-teal"
                    />
                    <span className="ml-2 text-sm text-archer-light-text/80">Hide completed tasks</span>
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm font-medium text-archer-bright-teal bg-archer-bright-teal/10 hover:bg-archer-bright-teal/20 rounded-md transition-colors shadow-button"
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
