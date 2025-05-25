'use client';

import React, { useState } from 'react';

const DemoMonitorInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('performance');

  // Mock data for visualization
  const mockStats = {
    averagePerformance: 72,
    averageConfidence: 68,
    completionRate: 65,
    completedTasks: 28,
    totalTasks: 43,
    performanceTrend: [65, 68, 72, 70, 75, 73, 78],
    studyPatterns: [
      { timeOfDay: 'Morning', percentage: 15 },
      { timeOfDay: 'Afternoon', percentage: 45 },
      { timeOfDay: 'Evening', percentage: 30 },
      { timeOfDay: 'Night', percentage: 10 }
    ],
    studyConsistency: [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 1.8 },
      { day: 'Wed', hours: 3.2 },
      { day: 'Thu', hours: 2.0 },
      { day: 'Fri', hours: 1.5 },
      { day: 'Sat', hours: 4.5 },
      { day: 'Sun', hours: 3.8 }
    ],
    scheduleAdherence: {
      onTime: 68,
      late: 22,
      missed: 10
    },
    sessionDurations: [
      { duration: '< 30 min', percentage: 15 },
      { duration: '30-60 min', percentage: 45 },
      { duration: '1-2 hours', percentage: 30 },
      { duration: '> 2 hours', percentage: 10 }
    ],
    topicPerformance: [
      { topicName: 'Management of Care', score: 65 },
      { topicName: 'Safety & Infection Control', score: 78 },
      { topicName: 'Health Promotion', score: 82 },
      { topicName: 'Psychosocial Integrity', score: 58 },
      { topicName: 'Basic Care & Comfort', score: 72 }
    ],
    topicTimeInvestment: [
      { topic: 'Management of Care', timeSpent: 12.5, performance: 65 },
      { topic: 'Safety & Infection Control', timeSpent: 8.2, performance: 78 },
      { topic: 'Health Promotion', timeSpent: 10.1, performance: 82 },
      { topic: 'Psychosocial Integrity', timeSpent: 5.5, performance: 58 },
      { topic: 'Basic Care & Comfort', timeSpent: 7.8, performance: 72 }
    ],
    readinessScore: 68,
    daysUntilExam: 45,
    examDate: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
    readinessProjection: [
      { week: 1, actual: 45 },
      { week: 2, actual: 52 },
      { week: 3, actual: 58 },
      { week: 4, actual: 65 },
      { week: 5, actual: 72 },
      { week: 6, actual: 78 },
      { week: 7, projected: 82 },
      { week: 8, projected: 85 },
      { week: 9, projected: 88 }
    ],
    readinessBreakdown: {
      Knowledge: 71,
      TestStrategy: 63,
      TimeManagement: 75,
      Confidence: 58
    }
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  // Helper function to get text color based on score
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-green-500';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Monitor Agent Insights</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'performance'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'studyHabits'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('studyHabits')}
        >
          Study Habits
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'topics'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('topics')}
        >
          Topics
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'readiness'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('readiness')}
        >
          Readiness
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-1">
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-indigo-600 mb-1">Average Score</div>
                  <div className="text-2xl font-bold text-gray-800">{mockStats.averagePerformance}%</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-indigo-600 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-gray-800">{mockStats.averageConfidence}%</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-indigo-600 mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-gray-800">{mockStats.completionRate}%</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-indigo-600 mb-1">Tasks Completed</div>
                  <div className="text-2xl font-bold text-gray-800">{mockStats.completedTasks}/{mockStats.totalTasks}</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Trend</h3>
              <div className="h-40 flex items-end space-x-2">
                {mockStats.performanceTrend.map((score, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className={`${getScoreColor(score)} rounded-t w-full`} 
                      style={{ height: `${score}%` }}
                    ></div>
                    <div className="text-xs mt-1">{index + 1}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">Last 7 Assessments</div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Insights</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>Your performance has been improving steadily over the last 7 assessments. Continue focusing on consistent study habits to maintain this trend.</p>
                <p className="mt-2">Recommendation: Increase practice in Psychosocial Integrity topics where your scores are lower.</p>
              </div>
            </div>
          </div>
        )}

        {/* Study Habits Tab */}
        {activeTab === 'studyHabits' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Study Time Distribution</h3>
              <div className="h-40 flex items-end space-x-2">
                {mockStats.studyPatterns.map((pattern, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-indigo-500 rounded-t w-full"
                      style={{ height: `${pattern.percentage * 2}%` }}
                    ></div>
                    <div className="text-xs mt-1">{pattern.timeOfDay}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">Time of Day</div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Weekly Study Consistency</h3>
              <div className="h-40 flex items-end space-x-2">
                {mockStats.studyConsistency.map((day, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-blue-500 rounded-t w-full"
                      style={{ height: `${day.hours * 10}%` }}
                    ></div>
                    <div className="text-xs mt-1">{day.day}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">Hours per Day</div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Schedule Adherence</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex justify-between mb-2">
                  <div className="text-xs text-gray-500">On Time</div>
                  <div className="text-xs font-medium">{mockStats.scheduleAdherence.onTime}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${mockStats.scheduleAdherence.onTime}%` }}></div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <div className="text-xs text-gray-500">Late</div>
                  <div className="text-xs font-medium">{mockStats.scheduleAdherence.late}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${mockStats.scheduleAdherence.late}%` }}></div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <div className="text-xs text-gray-500">Missed</div>
                  <div className="text-xs font-medium">{mockStats.scheduleAdherence.missed}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${mockStats.scheduleAdherence.missed}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Session Duration</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockStats.sessionDurations.map((session, index) => (
                  <div key={index} className="bg-indigo-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-indigo-600">{session.percentage}%</div>
                    <div className="text-xs text-gray-600">{session.duration}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Study Pattern Insights</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                <p>You study most effectively in the afternoon, with 45% of your study time in this period. Your weekend study sessions are longer than weekday sessions.</p>
                <p className="mt-2">Recommendation: Consider scheduling more challenging topics during your afternoon sessions when you're most productive.</p>
              </div>
            </div>
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Topic Performance</h3>
              <div className="space-y-3">
                {mockStats.topicPerformance.map((topic, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{topic.topicName}</span>
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

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Time Investment vs. Performance</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="space-y-4">
                  {mockStats.topicTimeInvestment.map((topic, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{topic.topic}</span>
                        <span className="text-xs text-gray-500">{topic.timeSpent} hours spent</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2/3 bg-gray-200 rounded-l-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-l-full"
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
                        <div className="w-2/3 text-blue-600">Time Spent</div>
                        <div className="w-1/3 text-green-600 ml-1">Performance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Efficiency Analysis</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockStats.topicTimeInvestment.map((topic, index) => {
                  const efficiency = topic.performance / topic.timeSpent;
                  let efficiencyClass = "text-yellow-600";
                  if (efficiency > 8) efficiencyClass = "text-green-600";
                  if (efficiency < 6) efficiencyClass = "text-red-600";
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">{topic.topic}</div>
                      <div className={`text-lg font-bold ${efficiencyClass}`}>
                        {efficiency.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">points per hour</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Topic Insights</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p>Health Promotion is your strongest topic with 82% performance. Psychosocial Integrity needs the most improvement at 58%.</p>
                <p className="mt-2">Recommendation: Allocate more study time to Psychosocial Integrity while maintaining your strong performance in Health Promotion.</p>
              </div>
            </div>
          </div>
        )}

        {/* Readiness Tab */}
        {activeTab === 'readiness' && (
          <div>
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-2">
                <div className="text-3xl font-bold text-indigo-700">{mockStats.readinessScore}%</div>
              </div>
              <h3 className="text-sm font-medium text-gray-700">Overall Readiness Score</h3>
            </div>

            <div className="mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Exam Date</div>
                <div className="text-xl font-bold text-gray-900">{new Date(mockStats.examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div className="mt-2 inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {mockStats.daysUntilExam} days remaining
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Readiness Projection</h3>
              <div className="h-48 bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-end space-x-1">
                {mockStats.readinessProjection.map((week, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t-sm ${week.actual ? 'bg-blue-500' : 'bg-green-500 bg-opacity-50 border-2 border-dashed border-green-500'}`} 
                      style={{ height: `${(week.actual || week.projected) * 0.6}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1">W{week.week}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-2 space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 bg-opacity-50 border border-dashed border-green-500 rounded-sm mr-1"></div>
                  <span className="text-gray-600">Projected</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Readiness Breakdown</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(mockStats.readinessBreakdown).map(([key, value], index) => {
                  let colorClass = "text-blue-600";
                  let statusText = "Average";
                  
                  if (value > mockStats.readinessScore * 1.05) {
                    colorClass = "text-green-600";
                    statusText = "Strong";
                  } else if (value < mockStats.readinessScore * 0.95) {
                    colorClass = "text-red-600";
                    statusText = "Needs attention";
                  }
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className={`text-2xl font-bold ${colorClass}`}>
                        {Math.round(value)}%
                      </div>
                      <div className="text-xs text-gray-500">{statusText}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Readiness Insights</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <p>Your readiness score is on track to reach 85% by exam day. Time Management is your strongest area, while Confidence needs improvement.</p>
                <p className="mt-2">Recommendation: Focus on building confidence through more practice tests and review sessions in the final weeks before the exam.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMonitorInsights;
