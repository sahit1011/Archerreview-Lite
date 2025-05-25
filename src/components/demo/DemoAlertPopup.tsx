'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Alert {
  _id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

interface DemoAlertPopupProps {
  alerts: Alert[];
  onClose: () => void;
  onResolve: (alertId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const DemoAlertPopup: React.FC<DemoAlertPopupProps> = ({ 
  alerts, 
  onClose, 
  onResolve,
  position = 'top-right'
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-14 left-0';
      case 'bottom-right':
        return 'bottom-14 right-0';
      case 'bottom-left':
        return 'bottom-14 left-0';
      case 'top-right':
      default:
        return 'top-14 right-0';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MISSED_TASK':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'LOW_PERFORMANCE':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'TOPIC_DIFFICULTY':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'SCHEDULE_DEVIATION':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const filteredAlerts = activeFilter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === activeFilter);

  return (
    <div className={`absolute ${getPositionClasses()} w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden`}>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-medium text-gray-700">Alerts</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="p-2 border-b border-gray-200 flex space-x-1 bg-gray-50">
        <button
          className={`px-2 py-1 text-xs rounded-md ${activeFilter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button
          className={`px-2 py-1 text-xs rounded-md ${activeFilter === 'MISSED_TASK' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveFilter('MISSED_TASK')}
        >
          Missed Tasks
        </button>
        <button
          className={`px-2 py-1 text-xs rounded-md ${activeFilter === 'LOW_PERFORMANCE' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveFilter('LOW_PERFORMANCE')}
        >
          Performance
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No alerts to display
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div key={alert._id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
              <div className="flex items-start">
                <div className={`flex-shrink-0 rounded-full p-1.5 ${getSeverityColor(alert.severity)}`}>
                  {getTypeIcon(alert.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                    <button
                      onClick={() => onResolve(alert._id)}
                      className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formatTime(alert.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {alerts.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={() => alerts.forEach(alert => onResolve(alert._id))}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoAlertPopup;
