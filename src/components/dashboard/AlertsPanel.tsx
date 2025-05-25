import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BellIcon, ExclamationCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Alert {
  _id: string;
  type: 'MISSED_TASK' | 'LOW_PERFORMANCE' | 'SCHEDULE_DEVIATION' | 'TOPIC_DIFFICULTY' | 'STUDY_PATTERN' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  createdAt: string;
}

interface AlertsPanelProps {
  userId: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ userId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/alerts?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setAlerts(data.alerts);
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

    if (userId) {
      fetchAlerts();
    }
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
      } else {
        setError(data.message || 'Failed to resolve alert');
      }
    } catch (err) {
      setError('Error resolving alert');
      console.error(err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-600 border border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-600 border border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-600 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MISSED_TASK':
        return (
          <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
          </div>
        );
      case 'LOW_PERFORMANCE':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
          </div>
        );
      case 'SCHEDULE_DEVIATION':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-400/20 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-orange-400" />
          </div>
        );
      case 'TOPIC_DIFFICULTY':
        return (
          <div className="w-8 h-8 rounded-full bg-archer-light-blue/20 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-archer-light-blue" />
          </div>
        );
      case 'STUDY_PATTERN':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shadow-button">
            <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-dark-text">Alerts</h2>
          <div className="animate-pulse h-8 w-8 bg-light-bg-secondary rounded-full shadow-button"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex items-start p-4 bg-light-bg-secondary rounded-lg shadow-card">
              <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-dark-text">Alerts</h2>
          <div className="w-8 h-8 rounded-full bg-light-bg-secondary flex items-center justify-center shadow-button">
            <BellIcon className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <div className="p-4 bg-red-100 text-red-600 rounded-lg shadow-button border border-red-300">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-archer-dark-text">Alerts</h2>
        <div className="flex items-center">
          {alerts.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 mr-3 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-button">
              {alerts.length}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 rounded-full bg-light-bg-secondary flex items-center justify-center shadow-button hover:bg-light-bg-gradient-end transition-all"
          >
            <BellIcon className="h-5 w-5 text-archer-dark-text" />
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-light-bg-secondary rounded-lg shadow-card border border-border-color-light">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 shadow-button">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-archer-dark-text">No alerts at this time</p>
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: expanded ? 'auto' : alerts.length > 2 ? '200px' : 'auto',
            opacity: 1
          }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`flex items-start p-4 rounded-lg shadow-card hover:shadow-card-hover transition-all ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex-shrink-0 mr-3">
                {getTypeIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium text-archer-dark-text">{alert.message}</p>
                  <button
                    onClick={() => handleResolveAlert(alert._id)}
                    className="ml-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shadow-button hover:bg-gray-300 transition-all"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs mt-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                  {formatDate(alert.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!expanded && alerts.length > 2 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center text-sm bg-archer-bright-teal text-white rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 py-2"
            >
              Show {alerts.length - 2} more alerts
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AlertsPanel;
