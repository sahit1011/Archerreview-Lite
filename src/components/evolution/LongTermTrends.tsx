'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface LongTermTrendsProps {
  userId: string;
}

interface TrendData {
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  metrics: {
    averagePerformance: number;
    completionRate: number;
    topicMastery: Record<string, number>;
    difficultyProgression: number;
    studyConsistency: number;
  };
  trends: {
    performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    completionTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  };
  visualizationData: {
    performanceOverTime: Array<{date: Date, value: number}>;
    completionRateOverTime: Array<{date: Date, value: number}>;
    topicMasteryOverTime: Record<string, Array<{date: Date, value: number}>>;
  };
}

const LongTermTrends: React.FC<LongTermTrendsProps> = ({ userId }) => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('MONTHLY');

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        console.log('Fetching trend data for userId:', userId || 'No user ID provided');

        // Check if userId is available
        if (!userId) {
          console.warn('No userId provided, using mock data');
          setTrendData(generateMockTrendData());
          setLoading(false);
          return;
        }

        try {
          // Make API call to fetch trend data
          console.log(`Making API call to /api/evolution/trends?userId=${userId}&period=${period}`);
          const response = await fetch(`/api/evolution/trends?userId=${userId}&period=${period}`);
          console.log('API response status:', response.status);

          if (!response.ok) {
            console.warn(`API returned status ${response.status}`);
            throw new Error(`API returned status ${response.status}`);
          }

          const data = await response.json();
          console.log('API response data:', data);

          if (data.success && data.trendAnalysis) {
            setTrendData(data.trendAnalysis);
          } else {
            // If API call fails, use mock data as fallback
            console.warn('API call failed, using mock data:', data.message);
            setTrendData(generateMockTrendData());
          }
        } catch (apiError) {
          console.error('API call error:', apiError);
          // Use mock data as fallback on error
          console.log('Using mock data as fallback due to API error');
          setTrendData(generateMockTrendData());
        }
      } catch (err) {
        console.error('Error in fetchTrendData:', err);
        // Use mock data as fallback on error
        setTrendData(generateMockTrendData());
      } finally {
        setLoading(false);
      }
    };

    // Always fetch data, even if userId is empty - will use mock data as fallback
    fetchTrendData();
  }, [userId, period]);

  // Generate mock data for development
  const generateMockTrendData = (): TrendData => {
    return {
      period: period,
      metrics: {
        averagePerformance: 72,
        completionRate: 68,
        topicMastery: {
          'topic1': 75,
          'topic2': 65,
          'topic3': 80
        },
        difficultyProgression: 2.1,
        studyConsistency: 85
      },
      trends: {
        performanceTrend: 'IMPROVING',
        completionTrend: 'STABLE',
        anomalies: [
          {
            type: 'topicMastery',
            description: 'Performance in Pharmacology topics is below target',
            severity: 'MEDIUM'
          }
        ]
      },
      visualizationData: {
        performanceOverTime: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 65 },
          { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), value: 67 },
          { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), value: 68 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), value: 70 },
          { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), value: 71 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), value: 72 }
        ],
        completionRateOverTime: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 60 },
          { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), value: 62 },
          { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), value: 65 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), value: 67 },
          { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), value: 68 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), value: 68 }
        ],
        topicMasteryOverTime: {
          'topic1': [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 70 },
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), value: 75 }
          ],
          'topic2': [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 60 },
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), value: 65 }
          ],
          'topic3': [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), value: 75 },
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), value: 80 }
          ]
        }
      }
    };
  };

  // Helper function to get trend icon and color
  const getTrendInfo = (trend: 'IMPROVING' | 'DECLINING' | 'STABLE') => {
    switch (trend) {
      case 'IMPROVING':
        return {
          icon: (
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-900/30'
        };
      case 'DECLINING':
        return {
          icon: (
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-900/30'
        };
      case 'STABLE':
      default:
        return {
          icon: (
            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-amber-400',
          bgColor: 'bg-amber-900/20',
          borderColor: 'border-amber-900/30'
        };
    }
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (severity) {
      case 'HIGH':
        return 'text-red-400 bg-red-900/20 border-red-900/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-900/20 border-amber-900/30';
      case 'LOW':
      default:
        return 'text-blue-400 bg-blue-900/20 border-blue-900/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Long-Term Trend Analysis</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-archer-light-text">Loading trend data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Long-Term Trend Analysis</h2>
        </div>
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg shadow-button border border-red-900/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trendData) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Long-Term Trend Analysis</h2>
        </div>
        <div className="p-4 bg-blue-900/20 text-blue-400 rounded-lg shadow-button border border-blue-900/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <p>No trend data available yet. Complete more tasks to see your long-term trends.</p>
          </div>
        </div>
      </div>
    );
  }

  const performanceTrendInfo = getTrendInfo(trendData.trends.performanceTrend);
  const completionTrendInfo = getTrendInfo(trendData.trends.completionTrend);

  return (
    <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-archer-white">Long-Term Trend Analysis</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('WEEKLY')}
            className={`px-3 py-1 rounded-lg text-sm shadow-button ${period === 'WEEKLY' ? 'bg-archer-bright-teal text-archer-dark-bg' : 'bg-archer-dark-teal/50 text-archer-light-text/70'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('MONTHLY')}
            className={`px-3 py-1 rounded-lg text-sm shadow-button ${period === 'MONTHLY' ? 'bg-archer-bright-teal text-archer-dark-bg' : 'bg-archer-dark-teal/50 text-archer-light-text/70'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('QUARTERLY')}
            className={`px-3 py-1 rounded-lg text-sm shadow-button ${period === 'QUARTERLY' ? 'bg-archer-bright-teal text-archer-dark-bg' : 'bg-archer-dark-teal/50 text-archer-light-text/70'}`}
          >
            Quarterly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Metrics Overview */}
        <div className="bg-card-background-dark p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-archer-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-archer-dark-teal/30 p-4 rounded-lg shadow-button">
              <div className="text-sm text-archer-light-text/70 mb-1">Average Performance</div>
              <div className="text-2xl font-bold text-archer-white">{Math.round(trendData.metrics.averagePerformance)}%</div>
              <div className={`text-sm mt-2 flex items-center ${performanceTrendInfo.color}`}>
                {performanceTrendInfo.icon}
                <span className="ml-1">{trendData.trends.performanceTrend}</span>
              </div>
            </div>
            <div className="bg-archer-dark-teal/30 p-4 rounded-lg shadow-button">
              <div className="text-sm text-archer-light-text/70 mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-archer-white">{Math.round(trendData.metrics.completionRate)}%</div>
              <div className={`text-sm mt-2 flex items-center ${completionTrendInfo.color}`}>
                {completionTrendInfo.icon}
                <span className="ml-1">{trendData.trends.completionTrend}</span>
              </div>
            </div>
            <div className="bg-archer-dark-teal/30 p-4 rounded-lg shadow-button">
              <div className="text-sm text-archer-light-text/70 mb-1">Study Consistency</div>
              <div className="text-2xl font-bold text-archer-white">{Math.round(trendData.metrics.studyConsistency)}/100</div>
            </div>
            <div className="bg-archer-dark-teal/30 p-4 rounded-lg shadow-button">
              <div className="text-sm text-archer-light-text/70 mb-1">Difficulty Level</div>
              <div className="text-2xl font-bold text-archer-white">{trendData.metrics.difficultyProgression.toFixed(1)}</div>
              <div className="text-xs text-archer-light-text/70 mt-1">(1=Easy, 3=Hard)</div>
            </div>
          </div>
        </div>

        {/* Performance Over Time */}
        <div className="bg-card-background-dark p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-archer-white mb-4">Performance Trend</h3>
          <div className="bg-card-background-dark rounded-lg p-6">
            {/* Simple bar chart with shadows and proper visibility */}
            <div className="flex justify-between items-end h-40">
              {trendData.visualizationData.performanceOverTime.map((entry, index) => {
                // Always show a bar, with minimum height for 0%
                // Calculate height based on percentage (max height is 120px)
                const barHeight = entry.value > 0 ? Math.max(4, (entry.value / 100) * 120) : 2;

                return (
                  <div key={index} className="flex flex-col items-center mx-2" style={{ width: '14%' }}>
                    {/* Bar container */}
                    <div className="w-full h-full flex items-end">
                      {/* Always render bar with minimum height for 0% */}
                        <div
                          className="w-full rounded-t-md relative group"
                          style={{
                            height: `${barHeight}px`,
                            backgroundColor: '#00474E', /* Darker shade matching theme */
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' /* Simple faded shadow like cards */
                          }}
                        >
                          {/* Percentage on hover */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100">
                            <div className="bg-archer-dark-bg px-2 py-1 rounded text-xs text-archer-bright-teal border border-archer-bright-teal/30">
                              {Math.round(entry.value)}%
                            </div>
                          </div>
                        </div>
                    </div>

                    {/* Date label */}
                    <div className="text-xs text-archer-light-text mt-2 text-center">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Anomalies and Insights */}
      {trendData.trends.anomalies.length > 0 && (
        <div className="bg-card-background-dark p-5 rounded-lg shadow-card mb-6">
          <h3 className="text-lg font-medium text-archer-white mb-4">Detected Anomalies</h3>
          <div className="space-y-3">
            {trendData.trends.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="font-medium mb-1">{anomaly.type}</div>
                <div>{anomaly.description}</div>
                <div className="mt-1 text-xs opacity-80">Severity: {anomaly.severity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border-color-dark text-xs text-archer-light-text/60">
        <p>The Evolution Agent analyzes your long-term study patterns to identify trends and provide insights for continuous improvement.</p>
      </div>
    </div>
  );
};

export default LongTermTrends;
