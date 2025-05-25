'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMinutes, parseISO } from 'date-fns';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  initialDate?: Date;
  studyPlanId: string;
}

export default function TaskCreationModal({
  isOpen,
  onClose,
  onSubmit,
  initialDate = new Date(),
  studyPlanId
}: TaskCreationModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<string>('QUIZ');
  const [topicId, setTopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(30); // Default 30 minutes

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    type?: string;
    topicId?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  // Fetch topics when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTopics();
      
      // Initialize date/time fields with the initialDate
      const formattedDate = format(initialDate, "yyyy-MM-dd'T'HH:mm");
      setStartTime(formattedDate);
      
      // Set end time to 30 minutes after start time by default
      const endDateTime = addMinutes(initialDate, 30);
      setEndTime(format(endDateTime, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [isOpen, initialDate]);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (startTime) {
      try {
        const startDateTime = parseISO(startTime);
        const endDateTime = addMinutes(startDateTime, duration);
        setEndTime(format(endDateTime, "yyyy-MM-dd'T'HH:mm"));
      } catch (error) {
        console.error('Error updating end time:', error);
      }
    }
  }, [startTime, duration]);

  // Fetch topics from API
  const fetchTopics = async () => {
    setTopicsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/topics');
      const data = await response.json();

      if (data.success) {
        setTopics(data.topics);
        
        // Set default topic if available
        if (data.topics.length > 0) {
          setTopicId(data.topics[0]._id);
        }
      } else {
        setError(data.message || 'Failed to fetch topics');
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('An error occurred while fetching topics');
    } finally {
      setTopicsLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: any = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    }

    if (!type) {
      errors.type = 'Task type is required';
    }

    if (!topicId) {
      errors.topicId = 'Topic is required';
    }

    if (!startTime) {
      errors.startTime = 'Start time is required';
    }

    if (!endTime) {
      errors.endTime = 'End time is required';
    } else if (new Date(endTime) <= new Date(startTime)) {
      errors.endTime = 'End time must be after start time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate duration in minutes
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      const taskData = {
        planId: studyPlanId,
        title,
        description,
        type,
        topicId,
        difficulty,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationMinutes,
        status: 'PENDING'
      };

      await onSubmit(taskData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('QUIZ');
      setTopicId(topics.length > 0 ? topics[0]._id : '');
      setDifficulty('MEDIUM');
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('An error occurred while creating the task');
    } finally {
      setLoading(false);
    }
  };

  // Close modal when clicking outside
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(parseInt(e.target.value));
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Task title"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Task description"
                  ></textarea>
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>

                {/* Task Type */}
                <div className="mb-4">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Type*
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      formErrors.type ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                  >
                    <option value="QUIZ">Quiz</option>
                    <option value="VIDEO">Video</option>
                    <option value="READING">Reading</option>
                    <option value="PRACTICE">Practice</option>
                    <option value="REVIEW">Review</option>
                  </select>
                  {formErrors.type && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                  )}
                </div>

                {/* Topic */}
                <div className="mb-4">
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                    Topic*
                  </label>
                  {topicsLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-indigo-600 border-solid rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Loading topics...</span>
                    </div>
                  ) : (
                    <>
                      <select
                        id="topic"
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        className={`w-full px-3 py-2 border ${
                          formErrors.topicId ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      >
                        {topics.map((topic) => (
                          <option key={topic._id} value={topic._id}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.topicId && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.topicId}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time*
                    </label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        formErrors.startTime ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {formErrors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <select
                      id="duration"
                      value={duration}
                      onChange={handleDurationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>

                {/* End Time (Read-only) */}
                <div className="mb-4">
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm focus:outline-none"
                  />
                  {formErrors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>
                  )}
                </div>

                {/* Difficulty */}
                <div className="mb-6">
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value="EASY"
                        checked={difficulty === 'EASY'}
                        onChange={() => setDifficulty('EASY')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Easy</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value="MEDIUM"
                        checked={difficulty === 'MEDIUM'}
                        onChange={() => setDifficulty('MEDIUM')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Medium</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value="HARD"
                        checked={difficulty === 'HARD'}
                        onChange={() => setDifficulty('HARD')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Hard</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Task'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
