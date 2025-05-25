import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import AlertPopup from './AlertPopup';

interface AlertButtonProps {
  userId: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AlertButton: React.FC<AlertButtonProps> = ({ userId, position = 'top-right' }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/alerts?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setAlerts(data.alerts);
          setUnreadCount(data.alerts.length);
        } else {
          setError(data.message || 'Failed to fetch alerts');
        }
      } catch (err) {
        setError('Error fetching alerts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Set up polling for new alerts every 30 seconds
    const intervalId = setInterval(fetchAlerts, 30000);

    return () => clearInterval(intervalId);
  }, [userId]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the resolved alert from the list
        setAlerts(alerts.filter(alert => alert._id !== alertId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setError(data.message || 'Failed to resolve alert');
      }
    } catch (err) {
      setError('Error resolving alert');
      console.error(err);
    }
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
    if (!showPopup) {
      // Mark all as read when opening
      setUnreadCount(0);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={togglePopup}
        className={`relative p-2 rounded-full bg-card-background-lighter shadow-button hover:bg-archer-dark-teal/70 transition-all transform hover:-translate-y-1 ${loading ? 'opacity-70' : ''}`}
        disabled={loading}
        aria-label="Alerts"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-archer-bright-teal" />
        ) : (
          <BellIcon className="h-6 w-6 text-archer-light-text" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-400 text-archer-dark-teal text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-button">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPopup && (
        <AlertPopup
          alerts={alerts}
          loading={loading}
          error={error}
          onClose={() => setShowPopup(false)}
          onResolve={handleResolveAlert}
          position={position}
        />
      )}
    </div>
  );
};

export default AlertButton;
