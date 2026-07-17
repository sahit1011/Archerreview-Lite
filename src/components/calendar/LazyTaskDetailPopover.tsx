'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { getCacheItem, setCacheItem } from '@/utils/cacheUtils';

interface TaskDetailPopoverProps {
  taskId: string | null;
  onClose: () => void;
}

export default function LazyTaskDetailPopover({ taskId, onClose }: TaskDetailPopoverProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch task details when taskId changes
  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    const fetchTaskDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `calendar_task_${taskId}`;
        const cachedTask = getCacheItem<any>(cacheKey);
        
        if (cachedTask) {
          console.log('Using cached task details');
          setTask(cachedTask);
          setLoading(false);
          return;
        }

        // If not in cache, fetch from API
        const response = await fetch(`/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.success) {
          console.log('Task details:', data.task);
          setTask(data.task);
          
          // Cache the task data for 5 minutes
          setCacheItem(cacheKey, data.task, 5 * 60 * 1000);
        } else {
          setError(data.message || 'Failed to fetch task details');
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('An error occurred while fetching task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  // Handle starting a task
  const handleStartTask = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the task in the local state
        setTask({ ...task, status: 'IN_PROGRESS' });
      } else {
        console.error('Failed to update task status:', data.message);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Handle completing a task
  const handleCompleteTask = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the task in the local state
        setTask({ ...task, status: 'COMPLETED' });
      } else {
        console.error('Failed to update task status:', data.message);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Handle starting a quiz
  const handleStartQuiz = () => {
    if (!task || !task.content) return;

    // Get the user ID from localStorage
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    if (!userId) {
      console.log('No userId found');
      setError('User ID not found. Please go back to the dashboard and try again.');
      return;
    }

    console.log('Starting quiz:', {
      contentId: task.content._id || task.content,
      taskId: task._id,
      userId
    });

    // Navigate to the quiz interface
    const contentId = task.content._id || task.content;
    router.push(`/quiz/${contentId}?taskId=${task._id}&userId=${userId}`);
    onClose(); // Close the popover
  };

  // Close popover when clicking outside
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get background color based on task type
  const getTaskBgColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-500/15';
      case 'QUIZ':
        return 'bg-primary/12';
      case 'READING':
        return 'bg-green-500/15';
      case 'PRACTICE':
        return 'bg-amber-500/15';
      case 'REVIEW':
        return 'bg-red-500/15';
      default:
        return 'bg-secondary';
    }
  };

  // Get text color based on task type
  const getTaskTextColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'text-blue-200';
      case 'QUIZ':
        return 'text-primary';
      case 'READING':
        return 'text-green-200';
      case 'PRACTICE':
        return 'text-amber-200';
      case 'REVIEW':
        return 'text-red-200';
      default:
        return 'text-foreground';
    }
  };

  // Get border color based on task type
  const getTaskBorderColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'border-blue-500/30';
      case 'QUIZ':
        return 'border-primary/30';
      case 'READING':
        return 'border-green-500/30';
      case 'PRACTICE':
        return 'border-amber-500/30';
      case 'REVIEW':
        return 'border-red-500/30';
      default:
        return 'border-border';
    }
  };

  // Render task detail skeleton
  const renderSkeleton = () => (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-24 bg-muted rounded"></div>
      <div className="flex space-x-2">
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <div className="h-10 bg-muted rounded w-1/3"></div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {taskId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleOutsideClick}
        >
          <motion.div
            className="rounded-2xl border border-border bg-card backdrop-blur-sm shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {loading ? (
              renderSkeleton()
            ) : error ? (
              <div className="p-6">
                <div className="flex items-center text-red-300 mb-4">
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-medium">Error</h3>
                </div>
                <p className="text-muted-foreground">{error}</p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : task ? (
              <>
                <div className={`p-6 ${getTaskBgColor(task.type)} ${getTaskTextColor(task.type)} border-b ${getTaskBorderColor(task.type)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{task.title}</h2>
                      <div className="flex items-center mt-1 text-sm">
                        <span className="font-medium">{task.type}</span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(task.startTime), 'h:mm a')} - {format(new Date(task.endTime), 'h:mm a')}</span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-foreground">{task.description}</p>
                  </div>

                  {task.topic && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Topic</h3>
                      <p className="text-foreground">{task.topic.name}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        task.status === 'COMPLETED' ? 'bg-green-500/15 text-green-300 border-green-500/30' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                        task.status === 'SKIPPED' ? 'bg-muted text-muted-foreground border-border' :
                        'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {task.status === 'COMPLETED' ? 'Completed' :
                         task.status === 'IN_PROGRESS' ? 'In Progress' :
                         task.status === 'SKIPPED' ? 'Skipped' :
                         'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-6">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={handleStartTask}
                        className="flex-1 bg-primary hover:brightness-110 text-primary-foreground font-semibold py-2 px-4 rounded-lg text-sm transition-all"
                      >
                        Start Task
                      </button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={handleCompleteTask}
                        className="flex-1 bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}

                    {task.type === 'QUIZ' && task.content && (
                      <button
                        onClick={handleStartQuiz}
                        className="flex-1 bg-primary hover:brightness-110 text-primary-foreground font-semibold py-2 px-4 rounded-lg text-sm transition-all"
                      >
                        Start Quiz
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="flex-1 bg-secondary hover:bg-muted text-foreground border border-border font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
