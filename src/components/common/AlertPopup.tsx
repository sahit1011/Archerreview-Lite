import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon, AcademicCapIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface Alert {
  _id: string;
  type: 'MISSED_TASK' | 'LOW_PERFORMANCE' | 'SCHEDULE_DEVIATION' | 'TOPIC_DIFFICULTY' | 'STUDY_PATTERN' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  createdAt: string;
}

interface AlertPopupProps {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onResolve: (alertId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AlertPopup: React.FC<AlertPopupProps> = ({
  alerts,
  loading,
  error,
  onClose,
  onResolve,
  position = 'top-right'
}) => {
  const [filter, setFilter] = useState<string>('all');
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-12 left-0';
      case 'bottom-right':
        return 'bottom-12 right-0';
      case 'bottom-left':
        return 'bottom-12 left-0';
      case 'top-right':
      default:
        return 'top-12 right-0';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-600';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-600';
      case 'LOW':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
      case 'STUDY_PATTERN':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
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

  const formatDate = (dateString: string) => {
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

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(alert => alert.type === filter);

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        className={`absolute ${getPositionClasses()} w-80 bg-card-background-light rounded-lg shadow-xl overflow-hidden z-[100] border border-border-color-light`}
        style={{ backgroundColor: 'var(--card-background-light)', backdropFilter: 'none' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-200" style={{ backgroundColor: 'var(--light-bg-secondary)' }}>
          <h3 className="font-semibold text-archer-dark-text">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-archer-bright-teal transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-2 border-b border-gray-200" style={{ backgroundColor: 'var(--light-bg-secondary)' }}>
          <div className="flex space-x-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 text-xs rounded-md shadow-button ${filter === 'all' ? 'bg-archer-bright-teal text-white' : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('MISSED_TASK')}
              className={`px-2 py-1 text-xs rounded-md shadow-button ${filter === 'MISSED_TASK' ? 'bg-archer-bright-teal text-white' : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'}`}
            >
              Missed Tasks
            </button>
            <button
              onClick={() => setFilter('LOW_PERFORMANCE')}
              className={`px-2 py-1 text-xs rounded-md shadow-button ${filter === 'LOW_PERFORMANCE' ? 'bg-archer-bright-teal text-white' : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'}`}
            >
              Performance
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-archer-bright-teal scrollbar-track-gray-200 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
          {loading ? (
            <div className="p-4 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-archer-bright-teal"></div>
              <p className="mt-2 text-sm text-gray-600">Loading alerts...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              <p>{error}</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <CheckCircleIcon className="h-10 w-10 text-green-600 mb-2" />
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'No alerts at this time'
                  : `No ${filter.toLowerCase().replace('_', ' ')} alerts`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 border-b border-gray-200 hover:bg-light-bg-secondary transition-colors"
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 rounded-full p-1.5 ${getSeverityColor(alert.severity)} shadow-button`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-archer-dark-text">{alert.message}</p>
                        <button
                          onClick={() => onResolve(alert._id)}
                          className="ml-2 text-xs text-gray-500 hover:text-archer-bright-teal transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(alert.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="p-2 border-t border-gray-200 bg-light-bg-secondary text-center">
            <button
              onClick={() => alerts.forEach(alert => onResolve(alert._id))}
              className="text-xs text-archer-bright-teal hover:text-archer-bright-teal/80 font-medium transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertPopup;
