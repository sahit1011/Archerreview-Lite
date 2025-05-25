'use client';

import React, { useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';

interface RemediationCleanupButtonProps {
  userId: string;
  onCleanupComplete?: () => void;
}

const RemediationCleanupButton: React.FC<RemediationCleanupButtonProps> = ({ userId, onCleanupComplete }) => {
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

      const response = await fetch('/api/cleanup/remediation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up remediation items');
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
      console.error('Error cleaning up remediation items:', err);
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
        className="flex items-center px-4 py-2 bg-archer-light-blue text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cleaning...
          </>
        ) : (
          <>
            <BellAlertIcon className="h-5 w-5 mr-2" />
            Remove Remediation Alerts
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-900/20 text-red-400 rounded-lg shadow-button">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="mt-3 p-4 bg-green-900/20 border border-green-900/30 rounded-lg shadow-card">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center mr-3 shadow-button">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium text-green-400">Cleanup successful!</span>
          </div>

          {result && (
            <div className="text-sm text-archer-light-text/80 bg-archer-dark-teal/30 p-3 rounded-lg">
              <p>{result.message}</p>
              <p className="mt-2">
                <span className="font-medium text-archer-bright-teal">Removed tasks:</span> {result.deletedTasks?.length || 0}
              </p>
              <p className="mt-1">
                <span className="font-medium text-archer-bright-teal">Resolved alerts:</span> {result.resolvedAlerts?.length || 0}
              </p>
            </div>
          )}

          <p className="text-sm text-archer-light-text/70 mt-3">Page will refresh in a moment to show changes...</p>
        </div>
      )}
    </div>
  );
};

export default RemediationCleanupButton;
