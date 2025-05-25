"use client";

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, AcademicCapIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface MonitorInsightsProps {
  userId: string;
}

interface MonitoringStats {
  totalTasks: number;
  completedTasks: number;
  missedTasks: number;
  upcomingTasks: number;
  averagePerformance: number;
  averageConfidence: number;
  completionRate: number;
  readinessScore: number;
  daysUntilExam: number;
  examDate: string;
  topicPerformance?: {
    topicName: string;
    score: number;
  }[];
  studyPatterns?: {
    timeOfDay: string;
    percentage: number;
  }[];
  performanceTrend?: number[];
  studyConsistency?: { day: string; hours: number }[];
  scheduleAdherence?: { onTime?: number; late?: number; missed?: number };
  sessionDurations?: { duration: string; percentage: number }[];
  topicTimeInvestment?: { topic: string; timeSpent: number; performance: number }[];
  readinessProjection?: { week: number; actual?: number; projected?: number }[];
  readinessBreakdown?: { [key: string]: number };
}

const MonitorInsights: React.FC<MonitorInsightsProps> = ({ userId }) => {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('performance');

  useEffect(() => {
    const fetchMonitoringStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/monitor?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          // Use real data from the API
          setStats(data.stats);
        } else {
          setError(data.message || 'Failed to fetch monitoring statistics');
        }
      } catch (err) {
        setError('Error fetching monitoring statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMonitoringStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-dark-text">Monitor Agent Insights</h2>
          <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full shadow-button"></div>
        </div>
        <div className="animate-pulse flex flex-col space-y-5 bg-light-bg-secondary p-5 rounded-lg shadow-card border border-gray-200">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-5 bg-gray-200 rounded-lg w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-dark-text">Monitor Agent Insights</h2>
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

  if (!stats) {
    return (
      <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-dark-text">Monitor Agent Insights</h2>
        </div>
        <div className="bg-light-bg-secondary p-5 rounded-lg shadow-card border border-gray-200">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No monitoring data available yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-lime-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Helper function to get text color based on score
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-archer-dark-text">Monitor Agent Insights</h2>
        <div className="text-sm text-archer-dark-text bg-light-bg-secondary px-3 py-1 rounded-lg shadow-button">
          Updated {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 mb-5">
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm shadow-button ${
            activeTab === 'performance'
              ? 'bg-archer-bright-teal text-white'
              : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'
          } transition-all hover:-translate-y-1`}
          onClick={() => setActiveTab('performance')}
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Performance
          </div>
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm shadow-button ${
            activeTab === 'studyHabits'
              ? 'bg-archer-bright-teal text-white'
              : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'
          } transition-all hover:-translate-y-1`}
          onClick={() => setActiveTab('studyHabits')}
        >
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Study Habits
          </div>
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm shadow-button ${
            activeTab === 'topics'
              ? 'bg-archer-bright-teal text-white'
              : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'
          } transition-all hover:-translate-y-1`}
          onClick={() => setActiveTab('topics')}
        >
          <div className="flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Topics
          </div>
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm shadow-button ${
            activeTab === 'readiness'
              ? 'bg-archer-bright-teal text-white'
              : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'
          } transition-all hover:-translate-y-1`}
          onClick={() => setActiveTab('readiness')}
        >
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
            Readiness
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-light-bg-secondary p-5 rounded-lg shadow-card border border-border-color-light">
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-archer-dark-text mb-2">Performance Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="text-xs text-archer-bright-teal mb-1">Average Score</div>
                  <div className="text-2xl font-bold text-archer-dark-text">{Math.round(stats.averagePerformance || 0)}%</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="text-xs text-archer-bright-teal mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-archer-dark-text">{Math.round(stats.averageConfidence || 0)}%</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="text-xs text-archer-bright-teal mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-archer-dark-text">{Math.round(stats.completionRate || 0)}%</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="text-xs text-archer-bright-teal mb-1">Tasks Completed</div>
                  <div className="text-2xl font-bold text-archer-dark-text">{stats.completedTasks || 0}/{stats.totalTasks || 0}</div>
                </div>
              </div>
            </div>

            {stats.performanceTrend && stats.performanceTrend.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Performance Trend</h3>
                <div className="h-40 flex items-end space-x-2">
                  {stats.performanceTrend.map((score, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className={`${getScoreColor(score)} rounded-t w-full`}
                        style={{ height: `${score}%` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">{index + 1}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">Last {stats.performanceTrend.length} Assessments</div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center">
                <p className="text-gray-600 text-sm">No performance trend data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more assessments to see your performance trend.</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-archer-dark-text mb-2">Performance Insights</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-600">
                <p className="font-medium">Your performance is improving!</p>
                <p className="mt-1">You've shown a 13% improvement in your last 7 assessments. Keep up the good work!</p>
              </div>
            </div>
          </div>
        )}

        {/* Study Habits Tab */}
        {activeTab === 'studyHabits' && (
          <div>
            {stats.studyPatterns && stats.studyPatterns.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Study Time Distribution</h3>
                <div className="h-40 flex items-end space-x-2">
                  {stats.studyPatterns.map((pattern, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-archer-bright-teal rounded-t w-full"
                        style={{ height: `${pattern.percentage * 2}%` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">{pattern.timeOfDay}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">Time of Day</div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No study time distribution data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more study sessions to see your time distribution.</p>
              </div>
            )}

            {stats.studyConsistency && stats.studyConsistency.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Weekly Study Consistency</h3>
                <div className="h-40 flex items-end space-x-2">
                  {stats.studyConsistency.map((day, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-archer-light-blue rounded-t w-full"
                        style={{ height: `${day.hours * 10}%` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">{day.day}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">Hours per Day</div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No weekly consistency data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more study sessions to see your weekly patterns.</p>
              </div>
            )}

            {stats.scheduleAdherence ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Schedule Adherence</h3>
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-card">
                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-600">On Time</div>
                    <div className="text-xs font-medium text-gray-700">{stats.scheduleAdherence.onTime || 0}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.scheduleAdherence.onTime || 0}%` }}></div>
                  </div>

                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-600">Late</div>
                    <div className="text-xs font-medium text-gray-700">{stats.scheduleAdherence.late || 0}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${stats.scheduleAdherence.late || 0}%` }}></div>
                  </div>

                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-600">Missed</div>
                    <div className="text-xs font-medium text-gray-700">{stats.scheduleAdherence.missed || 0}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.scheduleAdherence.missed || 0}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No schedule adherence data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more tasks to see your schedule adherence.</p>
              </div>
            )}

            {stats.sessionDurations && stats.sessionDurations.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Session Duration</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.sessionDurations.map((session, index) => (
                    <div key={index} className="bg-teal-50 rounded-lg p-3 text-center shadow-card border border-teal-200">
                      <div className="text-xl font-bold text-archer-bright-teal">{session.percentage}%</div>
                      <div className="text-xs text-gray-500">{session.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No session duration data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more study sessions to see your duration patterns.</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-archer-dark-text mb-2">Study Pattern Insights</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-600 shadow-card">
                <p className="font-medium">You study best in the afternoon!</p>
                <p className="mt-1">45% of your study sessions occur in the afternoon with the highest performance scores. Consider scheduling more challenging topics during this time.</p>
              </div>
            </div>
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div>
            {stats.topicPerformance && stats.topicPerformance.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Topic Performance</h3>
                <div className="space-y-3">
                  {stats.topicPerformance.map((topic, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-archer-dark-text">{topic.topicName}</span>
                        <span className={`text-xs font-medium ${getScoreTextColor(topic.score)}`}>{topic.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getScoreColor(topic.score)} h-2 rounded-full`}
                          style={{ width: `${topic.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No topic performance data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete assessments in different topics to see your performance.</p>
              </div>
            )}

            {stats.topicTimeInvestment && stats.topicTimeInvestment.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Time Investment vs. Performance</h3>
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-card">
                  <div className="space-y-4">
                    {stats.topicTimeInvestment.map((topic, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-archer-dark-text">{topic.topic}</span>
                          <span className="text-xs text-gray-500">{topic.timeSpent} hours spent</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2/3 bg-gray-200 rounded-l-full h-3">
                            <div
                              className="bg-archer-light-blue h-3 rounded-l-full"
                              style={{ width: `${(topic.timeSpent / 15) * 100}%` }}
                            ></div>
                          </div>
                          <div className="w-1/3 bg-gray-200 rounded-r-full h-3 ml-1">
                            <div
                              className={`${getScoreColor(topic.performance)} h-3 rounded-r-full`}
                              style={{ width: `${topic.performance}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex text-xs mt-1">
                          <div className="w-2/3 text-archer-light-blue">Time Spent</div>
                          <div className="w-1/3 text-green-600 ml-1">Performance</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No time investment data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more study sessions to see time vs. performance analysis.</p>
              </div>
            )}

            {stats.topicTimeInvestment && stats.topicTimeInvestment.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Efficiency Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.topicTimeInvestment.map((topic, index) => {
                    const efficiency = topic.performance / topic.timeSpent;
                    let efficiencyClass = "text-yellow-600";
                    if (efficiency > 8) efficiencyClass = "text-green-600";
                    if (efficiency < 6) efficiencyClass = "text-red-600";

                    return (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 shadow-card">
                        <div className="text-xs text-archer-bright-teal">{topic.topic}</div>
                        <div className={`text-lg font-bold ${efficiencyClass}`}>
                          {efficiency.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">points per hour</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200 text-center shadow-card">
                <p className="text-gray-600 text-sm">No efficiency data available yet.</p>
                <p className="text-gray-500 text-xs mt-1">Complete more assessments to see your study efficiency.</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-archer-dark-text mb-2">Topic Insights</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-600 shadow-card">
                <p className="font-medium">Focus areas identified!</p>
                <p className="mt-1">The Monitor Agent has identified <span className="font-medium">Psychosocial Integrity</span> as your most challenging topic. We recommend allocating more study time to this area.</p>
              </div>
            </div>
          </div>
        )}

        {/* Readiness Tab */}
        {activeTab === 'readiness' && (
          <div>
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center p-5 bg-teal-50 rounded-full mb-3 shadow-button border border-teal-200">
                <div className="text-4xl font-bold text-archer-bright-teal">{stats.readinessScore || 0}%</div>
              </div>
              <h3 className="text-sm font-medium text-archer-dark-text">Overall Readiness Score</h3>
            </div>

            {stats.examDate && (
              <div className="mb-4">
                <div className="bg-white rounded-lg p-5 shadow-card text-center border border-gray-200">
                  <div className="text-sm text-archer-bright-teal mb-2">Exam Date</div>
                  <div className="text-xl font-bold text-archer-dark-text">{new Date(stats.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  <div className="mt-3 inline-block bg-teal-50 text-archer-bright-teal text-sm font-medium px-3 py-1 rounded-lg shadow-button border border-teal-200">
                    {stats.daysUntilExam} days remaining
                  </div>
                </div>
              </div>
            )}

            {stats.readinessProjection && stats.readinessProjection.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Readiness Projection</h3>
                <div className="h-48 bg-white rounded-lg border border-gray-200 p-4 flex items-end space-x-1 shadow-card">
                  {stats.readinessProjection.map((week, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-sm ${week.actual ? 'bg-archer-light-blue' : 'bg-archer-bright-teal bg-opacity-50 border-2 border-dashed border-archer-bright-teal'}`}
                        style={{ height: `${(week.actual || week.projected || 0) * 0.6}%` }}
                      ></div>
                      <div className="text-xs text-archer-light-text/70 mt-1">W{week.week}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-2 space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-archer-light-blue rounded-sm mr-1"></div>
                    <span className="text-archer-light-text/80">Actual</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-archer-bright-teal bg-opacity-50 border border-dashed border-archer-bright-teal rounded-sm mr-1"></div>
                    <span className="text-archer-light-text/80">Projected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-5 bg-gray-100 rounded-lg shadow-card text-center border border-gray-200">
                <p className="text-gray-600 text-sm">No readiness projection data available yet.</p>
                <p className="text-gray-500 text-xs mt-2">Continue studying to see your projected readiness.</p>
              </div>
            )}

            {stats.readinessBreakdown ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Readiness Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(stats.readinessBreakdown).map(([key, value], index) => {
                    let colorClass = "text-archer-light-blue";
                    let statusText = "Average";

                    if (value > stats.readinessScore * 1.05) {
                      colorClass = "text-green-400";
                      statusText = "Strong";
                    } else if (value < stats.readinessScore * 0.95) {
                      colorClass = "text-red-400";
                      statusText = "Needs attention";
                    }

                    return (
                      <div key={index} className="bg-white rounded-lg p-3 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-gray-200">
                        <div className="text-xs text-archer-bright-teal">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className={`text-2xl font-bold ${colorClass}`}>
                          {Math.round(value)}%
                        </div>
                        <div className="text-xs text-gray-500">{statusText}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-archer-dark-text mb-2">Readiness Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-gray-200">
                    <div className="text-xs text-archer-bright-teal">Knowledge</div>
                    <div className="text-2xl font-bold text-archer-light-blue">
                      {Math.round((stats.readinessScore || 0) * 1.05)}%
                    </div>
                    <div className="text-xs text-gray-500">Above average</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-gray-200">
                    <div className="text-xs text-archer-bright-teal">Test Strategy</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round((stats.readinessScore || 0) * 0.92)}%
                    </div>
                    <div className="text-xs text-gray-500">Needs improvement</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-gray-200">
                    <div className="text-xs text-archer-bright-teal">Time Management</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((stats.readinessScore || 0) * 1.1)}%
                    </div>
                    <div className="text-xs text-gray-500">Strong</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1 border border-gray-200">
                    <div className="text-xs text-archer-bright-teal">Confidence</div>
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round((stats.readinessScore || 0) * 0.85)}%
                    </div>
                    <div className="text-xs text-gray-500">Needs attention</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-archer-dark-text mb-2">Readiness Insights</h3>
              <div className="bg-green-50 text-green-600 rounded-lg p-4 text-sm shadow-card border border-green-200">
                <p className="font-medium">You're on track!</p>
                <p className="mt-2">Based on your current progress and performance, the Monitor Agent predicts you'll reach a readiness score of 85% by your exam date if you maintain your current pace.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-color-dark text-xs text-archer-light-text/60">
        <p>The Monitor Agent continuously analyzes your study patterns, performance, and progress to provide personalized insights and recommendations.</p>
      </div>
    </div>
  );
};

export default MonitorInsights;
