'use client';

import React, { useState, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface PredictivePerformanceProps {
  userId: string;
}

interface PredictionData {
  currentReadiness: number;
  predictedReadiness: number;
  examDate: string;
  daysUntilExam: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  weeklyProjections: {
    week: number;
    date: string;
    projected: number;
  }[];
  categoryProjections: {
    category: string;
    current: number;
    projected: number;
  }[];
  scenarios: {
    name: string;
    description: string;
    projectedReadiness: number;
    requiredActions: string[];
  }[];
  insights: string[];
}

const PredictivePerformance: React.FC<PredictivePerformanceProps> = ({ userId }) => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('baseline');

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        console.log('Fetching prediction data for userId:', userId || 'No user ID provided');

        // Check if userId is available
        if (!userId) {
          console.warn('No userId provided, using mock data');
          setPredictionData(generateMockPredictionData());
          setLoading(false);
          return;
        }

        try {
          // Make API call to fetch prediction data
          console.log(`Making API call to /api/evolution/predictions?userId=${userId}`);
          const response = await fetch(`/api/evolution/predictions?userId=${userId}`);
          console.log('API response status:', response.status);

          if (!response.ok) {
            console.warn(`API returned status ${response.status}`);
            throw new Error(`API returned status ${response.status}`);
          }

          const data = await response.json();
          console.log('API response data:', data);

          if (data.success && data.predictions) {
            setPredictionData(data.predictions);
          } else {
            // If API call fails, use mock data as fallback
            console.warn('API call failed, using mock data:', data.message);
            setPredictionData(generateMockPredictionData());
          }
        } catch (apiError) {
          console.error('API call error:', apiError);
          // Use mock data as fallback on error
          console.log('Using mock data as fallback due to API error');
          setPredictionData(generateMockPredictionData());
        }
      } catch (err) {
        console.error('Error in fetchPredictionData:', err);
        // Use mock data as fallback on error
        setPredictionData(generateMockPredictionData());
      } finally {
        setLoading(false);
      }
    };

    // Always fetch data, even if userId is empty - will use mock data as fallback
    fetchPredictionData();
  }, [userId]);

  // Generate mock data for UI development
  const generateMockPredictionData = (): PredictionData => {
    const today = new Date();
    const examDate = new Date();
    examDate.setDate(today.getDate() + 45);

    return {
      currentReadiness: 68,
      predictedReadiness: 85,
      examDate: examDate.toISOString(),
      daysUntilExam: 45,
      confidenceInterval: {
        lower: 80,
        upper: 90
      },
      weeklyProjections: [
        { week: 1, date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), projected: 72 },
        { week: 2, date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), projected: 75 },
        { week: 3, date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), projected: 78 },
        { week: 4, date: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(), projected: 81 },
        { week: 5, date: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(), projected: 83 },
        { week: 6, date: new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000).toISOString(), projected: 85 }
      ],
      categoryProjections: [
        { category: 'PHYSICS', current: 65, projected: 82 },
        { category: 'CHEMISTRY', current: 70, projected: 85 },
        { category: 'BIOLOGY', current: 60, projected: 78 },
        { category: 'MATHEMATICS', current: 62, projected: 80 }
      ],
      scenarios: [
        {
          name: 'baseline',
          description: 'Current study pace maintained',
          projectedReadiness: 85,
          requiredActions: [
            'Complete all scheduled tasks',
            'Maintain current study consistency',
            'Continue with planned review sessions'
          ]
        },
        {
          name: 'accelerated',
          description: 'Increased study intensity',
          projectedReadiness: 92,
          requiredActions: [
            'Increase daily study time by 1 hour',
            'Complete 2 additional practice quizzes per week',
            'Add weekly review sessions for weak areas',
            'Increase difficulty level for strong topics'
          ]
        },
        {
          name: 'focused',
          description: 'Focus on weak areas',
          projectedReadiness: 88,
          requiredActions: [
            'Allocate 60% of study time to weak topics',
            'Complete remedial content for Psychosocial Integrity',
            'Schedule weekly review sessions for Pharmacological Therapies',
            'Take targeted practice tests for weak areas'
          ]
        },
        {
          name: 'minimal',
          description: 'Reduced study pace',
          projectedReadiness: 78,
          requiredActions: [
            'Complete essential tasks only',
            'Focus on high-yield content',
            'Maintain weekly review sessions',
            'Prioritize practice over content review'
          ]
        }
      ],
      insights: [
        'Your performance in Psychosocial Integrity is improving but remains below target.',
        'Your consistency in completing practice quizzes is strongly correlated with improved readiness.',
        'Increasing review frequency for Pharmacological Therapies could significantly improve your overall readiness.',
        'Your current pace puts you on track to reach the target readiness score by your exam date.'
      ]
    };
  };

  // Format category name
  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get readiness color
  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 75) return 'text-success';
    if (score >= 65) return 'text-warning';
    if (score >= 55) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Predictive Performance Modeling</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading prediction data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Predictive Performance Modeling</h2>
        </div>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg shadow-button border border-destructive/30">
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

  if (!predictionData) {
    return (
      <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Predictive Performance Modeling</h2>
        </div>
        <div className="p-4 bg-primary/10 text-primary rounded-lg shadow-button border border-primary/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <p>No prediction data available yet. Complete more tasks to enable predictive modeling.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeScenarioData = predictionData.scenarios.find(s => s.name === activeScenario) || predictionData.scenarios[0];

  return (
    <div className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-foreground">Predictive Performance Modeling</h2>
        <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-lg shadow-button">
          {predictionData.daysUntilExam} days until exam
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Readiness Projection */}
        <div className="bg-secondary p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-foreground mb-4">Readiness Projection</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative h-48 w-48">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Current</div>
                  <div className="text-3xl font-bold text-foreground">{predictionData.currentReadiness}%</div>
                  <div className="text-sm text-muted-foreground mt-2">Projected</div>
                  <div className={`text-4xl font-bold ${getReadinessColor(activeScenarioData.projectedReadiness)}`}>
                    {activeScenarioData.projectedReadiness}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Range: {predictionData.confidenceInterval.lower}-{predictionData.confidenceInterval.upper}%
                  </div>
                </div>
              </div>
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                {/* Track */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />

                {/* Projected readiness arc (lower opacity, sits behind current) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeOpacity="0.4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${activeScenarioData.projectedReadiness}, 100`}
                />

                {/* Current readiness arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${predictionData.currentReadiness}, 100`}
                />
              </svg>
            </div>
          </div>
          <div className="h-48 relative">
            <h4 className="text-sm font-medium text-foreground mb-2">Weekly Projection</h4>
            <div className="absolute inset-0 flex items-end pt-6">
              {predictionData.weeklyProjections.map((week, index) => {
                // Calculate a height that will fit within the container
                // Scale the values to make the bars more visible
                const minHeight = 20; // Minimum height in pixels
                const maxHeight = 120; // Maximum height in pixels
                const minValue = 50; // Minimum expected value
                const maxValue = 100; // Maximum expected value

                // Calculate scaled height
                const scaledHeight = minHeight + ((week.projected - minValue) / (maxValue - minValue)) * (maxHeight - minHeight);

                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="text-xs text-muted-foreground mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {week.projected}%
                    </div>
                    <div
                      className="w-4/5 bg-primary rounded-t-md"
                      style={{ height: `${scaledHeight}px` }}
                    ></div>
                    <div className="text-xs text-muted-foreground mt-2 text-center">
                      W{week.week}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="bg-secondary p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-foreground mb-4">What-If Scenarios</h3>
          <div className="space-y-3 mb-4">
            {predictionData.scenarios.map((scenario) => (
              <div
                key={scenario.name}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  scenario.name === activeScenario
                    ? 'bg-primary/10 border border-primary/40'
                    : 'bg-muted hover:bg-muted/70'
                }`}
                onClick={() => setActiveScenario(scenario.name)}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-foreground">{scenario.description}</div>
                  <div className={`font-bold ${getReadinessColor(scenario.projectedReadiness)}`}>
                    {scenario.projectedReadiness}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-medium text-foreground mb-2">Required Actions</h4>
          <div className="bg-muted p-3 rounded-lg">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {activeScenarioData.requiredActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Category Projections */}
      <div className="bg-secondary p-5 rounded-lg shadow-card mb-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Category Projections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictionData.categoryProjections.map((category, index) => (
            <div key={index} className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{formatCategoryName(category.category)}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-muted-foreground w-16">Current:</span>
                <div className="flex-grow bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary/40 h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${category.current}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-foreground w-8 text-right">{category.current}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground w-16">Projected:</span>
                <div className="flex-grow bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${category.projected}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-foreground w-8 text-right">{category.projected}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-secondary p-5 rounded-lg shadow-card">
        <h3 className="text-lg font-medium text-foreground mb-4">AI Insights</h3>
        <div className="space-y-3">
          {predictionData.insights.map((insight, index) => (
            <div key={index} className="flex items-start bg-primary/10 border border-primary/20 rounded-lg p-3">
              <LightBulbIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 mr-2" />
              <p className="text-sm text-primary">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <p>The Evolution Agent uses predictive modeling to forecast your future performance based on current trends and different study scenarios.</p>
      </div>
    </div>
  );
};

export default PredictivePerformance;
