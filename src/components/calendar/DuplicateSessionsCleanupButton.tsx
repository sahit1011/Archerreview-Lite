'use client';

import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DuplicateSessionsCleanupButtonProps {
  userId: string;
  onCleanupComplete?: () => void;
}

const DuplicateSessionsCleanupButton: React.FC<DuplicateSessionsCleanupButtonProps> = ({ userId, onCleanupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCleanup = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/cleanup/duplicate-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up duplicate sessions');
      }

      setResult(data);

      // Run a second pass to catch any remaining duplicates
      if (data.deletedTasks && data.deletedTasks.length > 0) {
        console.log("Running second pass to catch remaining duplicates");

        try {
          const secondResponse = await fetch('/api/cleanup/duplicate-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          const secondData = await secondResponse.json();

          if (secondResponse.ok && secondData.deletedTasks) {
            // Update the result with combined data
            setResult({
              ...data,
              message: `Cleaned up ${data.deletedTasks.length + secondData.deletedTasks.length} duplicate sessions across the calendar`,
              secondPass: {
                count: secondData.deletedTasks.length,
                timesSummary: secondData.timesSummary
              }
            });
          }
        } catch (err) {
          console.error('Error in second cleanup pass:', err);
        }
      }

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
      console.error('Error cleaning up duplicate sessions:', err);
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
        className="flex items-center px-3 py-1.5 bg-card text-primary border border-primary rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 transition-colors"
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
            Remove Duplicate Sessions
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

              {result.secondPass && result.secondPass.count > 0 && (
                <div className="mt-2 p-2 bg-green-100 rounded-md">
                  <p className="font-medium">Second cleanup pass:</p>
                  <p>Removed an additional {result.secondPass.count} duplicate tasks</p>

                  {result.secondPass.timesSummary && result.secondPass.timesSummary.length > 0 && (
                    <ul className="list-disc list-inside mt-1">
                      {result.secondPass.timesSummary.map((item: any) => (
                        <li key={item.time}>
                          {item.time} - {item.count} tasks
                        </li>
                      ))}
                    </ul>
                  )}
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

export default DuplicateSessionsCleanupButton;
