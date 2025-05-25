'use client';

import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import DemoAlertPopup from './DemoAlertPopup';

interface DemoAlertButtonProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const DemoAlertButton: React.FC<DemoAlertButtonProps> = ({ position = 'top-right' }) => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(4);

  // Mock alerts data
  const mockAlerts = [
    {
      _id: '1',
      type: 'MISSED_TASK',
      severity: 'HIGH',
      message: 'You have missed 3 consecutive tasks. Immediate attention required.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      _id: '2',
      type: 'LOW_PERFORMANCE',
      severity: 'MEDIUM',
      message: 'Performance is declining in recent tasks. Consider adjusting study approach.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      _id: '3',
      type: 'TOPIC_DIFFICULTY',
      severity: 'MEDIUM',
      message: 'Low performance detected in topic: Pediatrics (45%). Additional practice recommended.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      _id: '4',
      type: 'SCHEDULE_DEVIATION',
      severity: 'LOW',
      message: 'Tasks are completed an average of 1.5 days behind schedule. Consider adjusting the plan.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() // 1.5 days ago
    }
  ];

  const [alerts, setAlerts] = useState(mockAlerts);

  const handleResolveAlert = (alertId: string) => {
    // Remove the resolved alert from the list
    setAlerts(alerts.filter(alert => alert._id !== alertId));
    setUnreadCount(prev => Math.max(0, prev - 1));
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
        className="relative p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors duration-200"
        aria-label="Alerts"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-blue-500" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-500" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPopup && (
        <DemoAlertPopup 
          alerts={alerts}
          onClose={() => setShowPopup(false)}
          onResolve={handleResolveAlert}
          position={position}
        />
      )}
    </div>
  );
};

export default DemoAlertButton;
