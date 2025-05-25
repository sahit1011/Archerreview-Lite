'use client';

import React, { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface SpecificTimeCleanupButtonProps {
  userId: string;
  onCleanupComplete?: () => void;
}

const SpecificTimeCleanupButton: React.FC<SpecificTimeCleanupButtonProps> = ({ userId, onCleanupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00'); // Default to 9:00 AM
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  // Common times that might have duplicates
  const commonTimes = [
    '09:00', // 9:00 AM
    '10:00', // 10:00 AM
    '11:00', // 11:00 AM
    '12:00', // 12:00 PM
    '13:00', // 1:00 PM
    '14:00', // 2:00 PM
    '15:00', // 3:00 PM
    '16:00', // 4:00 PM
  ];

  const handleCleanup = async () => {
    if (!userId) {
      setError('User ID is required');
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
        body: JSON.stringify({ 
          userId,
          time: selectedTime
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up tasks at specific time');
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
      console.error('Error cleaning up specific time tasks:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display (24h to 12h)
  const formatTime = (time24h: string) => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowTimeSelector(!showTimeSelector)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <ClockIcon className="h-5 w-5 mr-2" />
        Clean Specific Time
      </button>

      {showTimeSelector && (
        <div className="absolute z-10 mt-2 w-64 bg-white rounded-md shadow-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Select time to clean up</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Common times:</label>
              <div className="grid grid-cols-2 gap-2">
                {commonTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`text-sm py-1 px-2 rounded ${
                      selectedTime === time 
                        ? 'bg-blue-100 text-blue-800 font-medium' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Custom time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setShowTimeSelector(false)}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCleanup}
              disabled={isLoading}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Cleaning...' : 'Clean Up'}
            </button>
          </div>
        </div>
      )}

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
                      <li key={task.id} className="text-xs">
                        {task.title} ({new Date(task.startTime).toLocaleString()})
                      </li>
                    ))}
                    {result.deletedTasks.length > 5 && (
                      <li className="text-xs">...and {result.deletedTasks.length - 5} more</li>
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

export default SpecificTimeCleanupButton;
