'use client';

import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface AllDuplicatesCleanupButtonProps {
  userId: string;
  onCleanupComplete?: () => void;
}

const AllDuplicatesCleanupButton: React.FC<AllDuplicatesCleanupButtonProps> = ({ userId, onCleanupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCleanup = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    // Confirm before proceeding
    if (!confirm('This will remove ALL duplicate tasks across your entire calendar. Continue?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/cleanup/all-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up duplicate tasks');
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
      console.error('Error cleaning up duplicate tasks:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCleanup}
        disabled={isLoading}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
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
            <TrashIcon className="h-5 w-5 mr-2" />
            Remove All Duplicates
          </>
        )}
      </button>

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
              
              {result.timesSummary && result.timesSummary.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Duplicates removed by time:</p>
                  <ul className="list-disc list-inside mt-1">
                    {result.timesSummary.map((item: any) => (
                      <li key={item.time}>
                        {item.time} - {item.count} tasks
                      </li>
                    ))}
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

export default AllDuplicatesCleanupButton;
