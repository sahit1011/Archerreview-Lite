'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface TaskDetailPopoverProps {
  taskId: string | null;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: string) => Promise<void>;
}

export default function TaskDetailPopover({
  taskId,
  onClose,
  onStatusChange
}: TaskDetailPopoverProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

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
        const response = await fetch(`/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.success) {
          console.log('Task details:', data.task);
          setTask(data.task);
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

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!taskId || !onStatusChange) return;

    setUpdatingStatus(true);
    setError(null); // Clear any previous errors

    try {
      // Call the parent component's onStatusChange function
      await onStatusChange(taskId, newStatus);

      // Update local task state
      setTask((prevTask: any) => ({
        ...prevTask,
        status: newStatus
      }));

      // Refetch the task to ensure we have the latest data
      try {
        const response = await fetch(`/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.success) {
          setTask(data.task);
        } else {
          console.warn('Task fetch returned success: false', data.message);
          // Don't set an error here as the status change was successful
        }
      } catch (fetchErr) {
        console.error('Error fetching updated task:', fetchErr);
        // Don't set an error here as the status change was successful
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);

      // Provide more detailed error message if available
      if (err.message) {
        setError(`Failed to update task status: ${err.message}`);
      } else {
        setError('Failed to update task status. Please try again.');
      }

      // Try to get more details if it's a response error
      if (err.response) {
        try {
          const errorData = await err.response.json();
          if (errorData && errorData.message) {
            setError(`Error: ${errorData.message}`);
          }
        } catch (e) {
          // Ignore error parsing response
        }
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle starting a quiz
  const handleStartQuiz = () => {
    if (!task || task.type !== 'QUIZ') {
      console.log('Not a quiz task or task is null');
      return;
    }

    if (!task.content) {
      console.log('Quiz task has no content');
      setError('This quiz content is not available. Please contact support.');
      return;
    }

    // Get the userId from localStorage or from the task
    let userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    // If userId is not in localStorage, try to get it from the URL
    if (!userId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      userId = urlParams.get('userId');
    }

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

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Close the popover and refresh the page to show the updated calendar
        onClose();
        window.location.reload();
      } else {
        setError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('An error occurred while deleting the task');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Close popover when clicking outside
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Token-driven badge classes for task type
  const getTypeBadgeClasses = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30';
      case 'QUIZ':
        return 'bg-primary/12 text-primary border border-primary/30';
      case 'READING':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'PRACTICE':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'REVIEW':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  // Token-driven badge classes for task status
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/15 text-success border border-success/30';
      case 'IN_PROGRESS':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30';
      case 'PENDING':
        return 'bg-warning/15 text-warning border border-warning/30';
      case 'SKIPPED':
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  // Token-driven tint for the task type icon tile
  const getTypeIconTint = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-sky-500/12 text-sky-600 dark:text-sky-400';
      case 'QUIZ':
        return 'bg-primary/12 text-primary';
      case 'READING':
        return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400';
      case 'PRACTICE':
        return 'bg-amber-500/12 text-amber-600 dark:text-amber-400';
      case 'REVIEW':
        return 'bg-rose-500/12 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-primary/12 text-primary';
    }
  };

  // Lucide-free inline icon per task type for the header tile
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>;
      case 'READING':
        return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>;
      case 'PRACTICE':
        return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" /></svg>;
      case 'REVIEW':
        return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>;
      case 'QUIZ':
      default:
        return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
    }
  };

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
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading task details...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg mb-4">
                  <div className="flex">
                    <svg className="h-6 w-6 text-destructive mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-destructive">{error}</p>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            ) : task ? (
              <>
                {/* Clean header: card surface, hairline divider, single accent icon tile */}
                <div className="bg-secondary/60 border-b border-border p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${getTypeIconTint(task.type)}`}>
                        {getTypeIcon(task.type)}
                      </span>
                      <h2 className="text-xl font-bold text-foreground min-w-0">{task.title}</h2>
                    </div>
                    <button
                      className="flex-shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeClasses(task.type)}`}>
                      {task.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {task.duration} min
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>

                  <div className="mb-6 bg-secondary border border-border rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Start Time</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(task.startTime), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">End Time</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(task.endTime), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Difficulty</span>
                        <span className="font-medium text-foreground">
                          {task.difficulty}
                        </span>
                      </div>
                      {task.topic && (
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Topic</span>
                          <span className="font-medium text-foreground">{task.topic.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {onStatusChange && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Update Status</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].map((status) => (
                          <button
                            key={status}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center active:scale-[0.98] ${
                              task.status === status
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : status === 'COMPLETED'
                                  ? 'bg-success/15 text-success hover:bg-success/25 border border-success/30'
                                  : status === 'IN_PROGRESS'
                                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 hover:bg-sky-500/25 border border-sky-500/30'
                                    : status === 'SKIPPED'
                                      ? 'bg-secondary text-foreground hover:bg-muted border border-border'
                                      : 'bg-warning/15 text-warning hover:bg-warning/25 border border-warning/30'
                            }`}
                            onClick={() => handleStatusChange(status)}
                            disabled={updatingStatus || task.status === status}
                          >
                            {updatingStatus && task.status !== status && (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            {status.replace('_', ' ')}
                            {task.status === status && (
                              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      {updatingStatus && (
                        <div className="mt-3 text-sm text-primary flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating task status...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-8 flex justify-between items-center">
                    {/* Delete button */}
                    <button
                      className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg font-medium transition-colors flex items-center active:scale-[0.98]"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Task
                    </button>

                    <div className="flex space-x-3">
                      {task.type === 'QUIZ' ? (
                        <>
                          {task.content ? (
                            <button
                              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
                              onClick={handleStartQuiz}
                            >
                              Start Quiz
                            </button>
                          ) : (
                            <div className="text-sm text-muted-foreground italic mr-auto">
                              This quiz is not yet available
                            </div>
                          )}
                        </>
                      ) : null}
                      <button
                        className="px-5 py-2.5 rounded-lg border border-border bg-secondary font-medium text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
                        onClick={onClose}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation dialog */}
                  {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                      <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 shadow-2xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-foreground mb-2">Delete Task</h3>
                        <p className="text-muted-foreground mb-6">
                          Are you sure you want to delete this task? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                          <button
                            className="px-4 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-lg font-medium transition-colors"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg font-medium transition-colors flex items-center active:scale-[0.98]"
                            onClick={handleDeleteTask}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-muted-foreground mb-6">No task selected</p>
                <button
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
