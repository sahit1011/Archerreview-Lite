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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SKIPPED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get task type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 text-blue-800';
      case 'QUIZ':
        return 'bg-purple-100 text-purple-800';
      case 'READING':
        return 'bg-green-100 text-green-800';
      case 'PRACTICE':
        return 'bg-amber-100 text-amber-800';
      case 'REVIEW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get task type header gradient
  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'from-blue-700 to-blue-500';
      case 'QUIZ':
        return 'from-purple-700 to-purple-500';
      case 'READING':
        return 'from-green-700 to-green-500';
      case 'PRACTICE':
        return 'from-amber-700 to-amber-500';
      case 'REVIEW':
        return 'from-red-700 to-red-500';
      default:
        return 'from-indigo-700 to-purple-600';
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
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          >
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-t-3 border-indigo-600 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Loading task details...</p>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                  <div className="flex">
                    <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
                <button
                  className="w-full px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 transition-colors"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            ) : task ? (
              <>
                {/* Header with task type-specific gradient background */}
                <div className={`bg-gradient-to-r ${getTypeGradient(task.type)} p-6`}>
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-white">{task.title}</h2>
                    <button
                      className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm`}>
                      {task.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      {task.duration} min
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-gray-700">{task.description}</p>
                  </div>

                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Start Time</span>
                        <span className="font-medium text-gray-800">
                          {format(new Date(task.startTime), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">End Time</span>
                        <span className="font-medium text-gray-800">
                          {format(new Date(task.endTime), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Difficulty</span>
                        <span className="font-medium text-gray-800">
                          {task.difficulty}
                        </span>
                      </div>
                      {task.topic && (
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs">Topic</span>
                          <span className="font-medium text-gray-800">{task.topic.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {onStatusChange && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].map((status) => (
                          <motion.button
                            key={status}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                              task.status === status
                                ? `bg-gradient-to-r ${getTypeGradient(task.type)} text-white shadow-lg`
                                : status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                                  : status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
                                    : status === 'SKIPPED'
                                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
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
                          </motion.button>
                        ))}
                      </div>
                      {updatingStatus && (
                        <div className="mt-3 text-sm text-green-600 flex items-center justify-center">
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Task
                    </motion.button>

                    <div className="flex space-x-3">
                      {task.type === 'QUIZ' ? (
                        <>
                          {task.content ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-5 py-2.5 bg-gradient-to-r ${getTypeGradient(task.type)} text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
                              onClick={handleStartQuiz}
                            >
                              Start Quiz
                            </motion.button>
                          ) : (
                            <div className="text-sm text-gray-500 italic mr-auto">
                              This quiz is not yet available
                            </div>
                          )}
                        </>
                      ) : null}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-5 py-2.5 bg-gradient-to-r ${getTypeGradient(task.type)} text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
                        onClick={onClose}
                      >
                        Close
                      </motion.button>
                    </div>
                  </div>

                  {/* Delete confirmation dialog */}
                  {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-xl">
                      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task</h3>
                        <p className="text-gray-700 mb-6">
                          Are you sure you want to delete this task? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                          <button
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
                            onClick={handleDeleteTask}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600 mb-6">No task selected</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                  onClick={onClose}
                >
                  Close
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
