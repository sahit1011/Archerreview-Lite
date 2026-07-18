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

  // Severity → destructive / warning / muted tokens only (no red/amber/blue rainbow).
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-destructive/10 text-destructive border border-destructive/30';
      case 'MEDIUM':
        return 'bg-warning/10 text-warning border border-warning/30';
      case 'LOW':
        return 'bg-secondary text-muted-foreground border border-border';
      default:
        return 'bg-secondary text-muted-foreground border border-border';
    }
  };

  // Type icon chips carry the semantic tone of the alert; MISSED_TASK is the only
  // one that maps to destructive, warnings to warning, the rest stay neutral.
  const getTypeChip = (type: string) => {
    switch (type) {
      case 'MISSED_TASK':
        return 'bg-destructive/10 text-destructive';
      case 'LOW_PERFORMANCE':
      case 'SCHEDULE_DEVIATION':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeChip(type)}`}>
      <ExclamationCircleIcon className="h-5 w-5" />
    </div>
  );

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
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Alerts</h2>
          <div className="animate-pulse h-8 w-8 bg-muted rounded-full"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse flex items-start p-4 bg-secondary rounded-lg border border-border">
              <div className="h-8 w-8 bg-muted rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-muted rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded-lg w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Alerts</h2>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <BellIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-destructive mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground">Alerts</h2>
        <div className="flex items-center">
          {alerts.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 mr-3 text-xs font-semibold leading-none text-destructive bg-destructive/15 rounded-full">
              {alerts.length}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border hover:bg-muted transition-all"
          >
            <BellIcon className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-secondary rounded-lg border border-border">
          <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mb-3">
            <CheckCircleIcon className="h-6 w-6 text-success" />
          </div>
          <p className="text-muted-foreground">No alerts at this time</p>
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
              className={`flex items-start p-4 rounded-lg transition-all ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex-shrink-0 mr-3">
                {getTypeIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium text-foreground">{alert.message}</p>
                  <button
                    onClick={() => handleResolveAlert(alert._id)}
                    className="ml-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-secondary transition-all"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs mt-2 text-muted-foreground bg-card px-3 py-1 rounded-lg inline-block">
                  {formatDate(alert.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {!expanded && alerts.length > 2 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center text-sm bg-primary text-primary-foreground font-semibold rounded-lg hover:brightness-110 transition-all py-2"
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
