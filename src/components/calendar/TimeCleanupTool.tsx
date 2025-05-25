'use client';

import React, { useState, useEffect } from 'react';
import { ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TimeCleanupToolProps {
  userId: string;
  onCleanupComplete?: () => void;
}

const TimeCleanupTool: React.FC<TimeCleanupToolProps> = ({ userId, onCleanupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [commonTimes, setCommonTimes] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Fetch tasks to analyze common times with duplicates
  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setTasks(data.tasks);
          analyzeCommonTimes(data.tasks);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, [userId]);

  // Analyze tasks to find common times with duplicates
  const analyzeCommonTimes = (tasks: any[]) => {
    // Group tasks by start time
    const tasksByTime = new Map();
    
    for (const task of tasks) {
      if (task.status !== 'PENDING') continue;
      
      const startTime = new Date(task.startTime);
      const timeKey = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      
      if (!tasksByTime.has(timeKey)) {
        tasksByTime.set(timeKey, []);
      }
      
      tasksByTime.get(timeKey).push(task);
    }
    
    // Find times with duplicates
    const timesWithDuplicates: string[] = [];
    
    for (const [time, timeTasks] of tasksByTime.entries()) {
      // Group by date and topic
      const tasksByDateAndTopic = new Map();
      
      for (const task of timeTasks) {
        if (!task.topic) continue;
        
        const topicId = task.topic._id.toString();
        const dateStr = new Date(task.startTime).toDateString();
        const key = `${dateStr}_${topicId}`;
        
        if (!tasksByDateAndTopic.has(key)) {
          tasksByDateAndTopic.set(key, []);
        }
        
        tasksByDateAndTopic.get(key).push(task);
      }
      
      // Check if there are duplicates
      let hasDuplicates = false;
      for (const [key, tasks] of tasksByDateAndTopic.entries()) {
        if (tasks.length > 1) {
          hasDuplicates = true;
          break;
        }
      }
      
      if (hasDuplicates) {
        timesWithDuplicates.push(time);
      }
    }
    
    // Sort times
    timesWithDuplicates.sort();
    setCommonTimes(timesWithDuplicates);
    
    // Set default selected time if there are common times
    if (timesWithDuplicates.length > 0) {
      setSelectedTime(timesWithDuplicates[0]);
    }
  };

  const handleCleanup = async () => {
    if (!userId || !selectedTime) {
      setError('User ID and time are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/cleanup/specific-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, time: selectedTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up tasks');
      }

      setResult(data);
      setShowSuccess(true);

      // Reload the page after cleanup to show the changes
      if (onCleanupComplete) {
        onCleanupComplete();
      } else {
        // Give user time to see the success message before reloading
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      console.error('Error cleaning up tasks:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Clean Up Duplicate Tasks</h3>
      
      <div className="mb-4">
        <label htmlFor="time-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Time with Duplicates
        </label>
        <div className="flex items-center space-x-2">
          <select
            id="time-select"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isLoading}
          >
            {commonTimes.length > 0 ? (
              commonTimes.map((time) => (
                <option key={time} value={time}>
                  {time} ({countDuplicatesAtTime(tasks, time)} duplicates)
                </option>
              ))
            ) : (
              <option value="09:00">09:00 (Default)</option>
            )}
          </select>
          
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cleaning...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Clean Up
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {showSuccess && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-800">Cleanup successful!</span>
          </div>
          
          {result && (
            <div className="text-sm text-green-700">
              <p>{result.message}</p>
              {result.deletedTasks && result.deletedTasks.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Removed tasks:</p>
                  <ul className="list-disc list-inside mt-1">
                    {result.deletedTasks.slice(0, 5).map((task: any) => (
                      <li key={task.id}>
                        {task.title} ({new Date(task.startTime).toLocaleTimeString()})
                      </li>
                    ))}
                    {result.deletedTasks.length > 5 && (
                      <li>...and {result.deletedTasks.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <p className="text-sm text-gray-600 mt-2">Page will refresh in a moment to show changes...</p>
        </div>
      )}
    </div>
  );
};

// Helper function to count duplicates at a specific time
function countDuplicatesAtTime(tasks: any[], time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Filter tasks by the specified time
  const tasksAtTime = tasks.filter(task => {
    if (task.status !== 'PENDING') return false;
    const taskTime = new Date(task.startTime);
    return taskTime.getHours() === hours && taskTime.getMinutes() === minutes;
  });
  
  // Group by date and topic
  const tasksByDateAndTopic = new Map();
  
  for (const task of tasksAtTime) {
    if (!task.topic) continue;
    
    const topicId = task.topic._id.toString();
    const dateStr = new Date(task.startTime).toDateString();
    const key = `${dateStr}_${topicId}`;
    
    if (!tasksByDateAndTopic.has(key)) {
      tasksByDateAndTopic.set(key, []);
    }
    
    tasksByDateAndTopic.get(key).push(task);
  }
  
  // Count duplicates
  let duplicateCount = 0;
  for (const [key, tasks] of tasksByDateAndTopic.entries()) {
    if (tasks.length > 1) {
      duplicateCount += tasks.length - 1;
    }
  }
  
  return duplicateCount;
}

export default TimeCleanupTool;
