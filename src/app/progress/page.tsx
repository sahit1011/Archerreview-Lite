'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUser } from '@/context/UserContext';
import PerformanceCharts from '@/components/progress/PerformanceCharts';
import TopicBreakdown from '@/components/progress/TopicBreakdown';
import ReadinessDetails from '@/components/progress/ReadinessDetails';
import PlanAdaptations from '@/components/progress/PlanAdaptations';
import MonitorInsights from '@/components/dashboard/MonitorInsights';
import {
  LongTermTrends,
  PlanVersionManagement,
  PredictivePerformance,
  PlanReviewOptimization
} from '@/components/evolution';

export default function ProgressPage() {
  const { user: authUser, isLoading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'performance' | 'readiness' | 'adaptations' | 'evolution'>('overview');
  const [activeSubTab, setActiveSubTab] = useState('overall'); // Default for performance tab
  const [evolutionSubTab, setEvolutionSubTab] = useState('trends'); // Separate state for evolution tab

  // Readiness score data
  const [readinessScore, setReadinessScore] = useState({
    overallScore: 0,
    projectedScore: 0,
    categoryScores: [] as { category: string; score: number }[],
    weakAreas: [] as any[],
    strongAreas: [] as any[]
  });

  // Task completion data
  const [completedTasks, setCompletedTasks] = useState({
    total: 0,
    completed: 0,
    byType: [] as { type: string; total: number; completed: number }[]
  });

  // Performance history data
  const [performanceHistory, setPerformanceHistory] = useState([
    { date: '2023-04-01', score: 55 },
    { date: '2023-04-08', score: 58 },
    { date: '2023-04-15', score: 62 },
    { date: '2023-04-22', score: 65 },
    { date: '2023-04-29', score: 68 },
    { date: '2023-05-06', score: 72 },
    { date: '2023-05-13', score: 75 }
  ]);

  // Topic breakdown data
  const [topics, setTopics] = useState<Array<{
    _id: string;
    name: string;
    category: string;
    score?: number;
    subtopics?: Array<{
      _id: string;
      name: string;
      category: string;
      score?: number;
    }>;
  }>>([]);

  // Plan adaptations data
  const [adaptations, setAdaptations] = useState<Array<{
    _id: string;
    type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
    description: string;
    reason: string;
    date: string;
    topicId?: string;
    topicName?: string;
    taskId?: string;
    taskTitle?: string;
    metadata?: Record<string, any>;
  }>>([]);

  // Helper function to process task completion stats
  const processTaskCompletionStats = (tasks: any[]) => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'COMPLETED').length;

    // Group tasks by type
    const tasksByType: Record<string, { total: number; completed: number }> = {};

    tasks.forEach(task => {
      if (!tasksByType[task.type]) {
        tasksByType[task.type] = {
          total: 0,
          completed: 0
        };
      }

      tasksByType[task.type].total += 1;

      if (task.status === 'COMPLETED') {
        tasksByType[task.type].completed += 1;
      }
    });

    // Convert to array format
    const byType = Object.entries(tasksByType).map(([type, data]) => ({
      type,
      total: data.total,
      completed: data.completed
    }));

    return { total, completed, byType };
  };

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);

        // Use the authenticated user
        if (authLoading) {
          return; // Wait for auth to complete
        }

        if (!authUser) {
          throw new Error('You must be logged in to view this page.');
        }

        // Fetch actual readiness score data from API
        const readinessResponse = await fetch(`/api/readiness-score?userId=${authUser.id}`);
        const readinessData = await readinessResponse.json();

        if (readinessData.success && readinessData.readinessScore) {
          console.log('Fetched readiness score:', readinessData.readinessScore);
          setReadinessScore({
            overallScore: readinessData.readinessScore.overallScore || 0,
            projectedScore: readinessData.readinessScore.projectedScore || 0,
            categoryScores: readinessData.readinessScore.categoryScores || [],
            weakAreas: readinessData.readinessScore.weakAreas || [],
            strongAreas: readinessData.readinessScore.strongAreas || []
          });
        } else {
          console.warn('Failed to fetch readiness score or no data available');
        }

        // Get user's study plan
        const planResponse = await fetch(`/api/study-plans?userId=${authUser.id}`);
        const planData = await planResponse.json();

        if (planData.success && planData.studyPlan) {
          // Fetch all tasks for the study plan
          const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}`);
          const tasksData = await tasksResponse.json();

          if (tasksData.success && tasksData.tasks) {
            // Process task completion stats
            const taskStats = processTaskCompletionStats(tasksData.tasks);
            setCompletedTasks(taskStats);
          }
        }

        // Mock performance history data
        setPerformanceHistory([
          { date: '2023-04-01', score: 55 },
          { date: '2023-04-08', score: 58 },
          { date: '2023-04-15', score: 62 },
          { date: '2023-04-22', score: 65 },
          { date: '2023-04-29', score: 68 },
          { date: '2023-05-06', score: 72 },
          { date: '2023-05-13', score: 75 }
        ]);

        // Mock topic data
        setTopics([
          {
            _id: '1',
            name: 'Pharmacology',
            category: 'PHARMACOLOGICAL_THERAPIES',
            score: 65,
            subtopics: [
              { _id: '1-1', name: 'Anticoagulants', category: 'PHARMACOLOGICAL_THERAPIES', score: 60 },
              { _id: '1-2', name: 'Pain Management', category: 'PHARMACOLOGICAL_THERAPIES', score: 70 }
            ]
          },
          {
            _id: '2',
            name: 'Cardiovascular',
            category: 'PHYSIOLOGICAL_ADAPTATION',
            score: 68,
            subtopics: [
              { _id: '2-1', name: 'Heart Failure', category: 'PHYSIOLOGICAL_ADAPTATION', score: 65 },
              { _id: '2-2', name: 'Arrhythmias', category: 'PHYSIOLOGICAL_ADAPTATION', score: 70 }
            ]
          },
          {
            _id: '3',
            name: 'Health Promotion',
            category: 'HEALTH_PROMOTION',
            score: 85,
            subtopics: [
              { _id: '3-1', name: 'Immunizations', category: 'HEALTH_PROMOTION', score: 80 },
              { _id: '3-2', name: 'Nutrition', category: 'HEALTH_PROMOTION', score: 90 }
            ]
          }
        ]);

        // Mock adaptations data
        setAdaptations([
          {
            _id: '1',
            type: 'RESCHEDULE',
            description: 'Rescheduled Pharmacology quiz to allow more study time',
            reason: 'Low performance on practice questions',
            date: '2023-05-01',
            topicId: '1',
            topicName: 'Pharmacology',
            taskId: '101',
            taskTitle: 'Pharmacology Quiz'
          },
          {
            _id: '2',
            type: 'CONTENT_ADDITION',
            description: 'Added additional practice questions on Cardiovascular topics',
            reason: 'Performance below target threshold',
            date: '2023-05-03',
            topicId: '2',
            topicName: 'Cardiovascular'
          },
          {
            _id: '3',
            type: 'DIFFICULTY_ADJUSTMENT',
            description: 'Adjusted difficulty of Anticoagulants content',
            reason: 'Multiple incorrect answers on assessment',
            date: '2023-05-05',
            topicId: '1-1',
            topicName: 'Anticoagulants'
          },
          {
            _id: '4',
            type: 'PLAN_REBALANCE',
            description: 'Rebalanced study plan to focus more on Pharmacology',
            reason: 'Performance gap identified in this area',
            date: '2023-05-10'
          },
          {
            _id: '5',
            type: 'REMEDIAL_CONTENT',
            description: 'Added remedial content for Heart Failure',
            reason: 'Failed assessment on this topic',
            date: '2023-05-12',
            topicId: '2-1',
            topicName: 'Heart Failure'
          }
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading progress data');
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [authUser, authLoading]);
  // Get category score color based on score
  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get task type color
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-500';
      case 'QUIZ':
        return 'bg-orange-500';
      case 'READING':
        return 'bg-green-500';
      case 'PRACTICE':
        return 'bg-purple-500'; // Changed back to standard Tailwind color
      case 'REVIEW':
        return 'bg-red-500'; // Changed to red for better visibility
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate days until exam
  const daysUntilExam = authUser?.examDate
    ? Math.ceil((new Date(authUser.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-archer-white">Progress Tracking</h1>
          <p className="text-archer-light-text/80">Monitor your NCLEX preparation progress and readiness.</p>
        </div>

        {/* Main Tabs */}
        <div className="mb-6 border-b border-border-color-dark">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === 'overview'
                  ? 'border-archer-bright-teal text-archer-bright-teal'
                  : 'border-transparent text-archer-light-text/70 hover:text-archer-light-text hover:border-archer-light-text/30'
              }`}
              onClick={() => setActiveMainTab('overview')}
            >
              Overview
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === 'performance'
                  ? 'border-archer-bright-teal text-archer-bright-teal'
                  : 'border-transparent text-archer-light-text/70 hover:text-archer-light-text hover:border-archer-light-text/30'
              }`}
              onClick={() => setActiveMainTab('performance')}
            >
              Performance by Topic
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === 'readiness'
                  ? 'border-archer-bright-teal text-archer-bright-teal'
                  : 'border-transparent text-archer-light-text/70 hover:text-archer-light-text hover:border-archer-light-text/30'
              }`}
              onClick={() => setActiveMainTab('readiness')}
            >
              Readiness Details
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === 'adaptations'
                  ? 'border-archer-bright-teal text-archer-bright-teal'
                  : 'border-transparent text-archer-light-text/70 hover:text-archer-light-text hover:border-archer-light-text/30'
              }`}
              onClick={() => setActiveMainTab('adaptations')}
            >
              Plan Adaptations
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === 'evolution'
                  ? 'border-archer-bright-teal text-archer-bright-teal'
                  : 'border-transparent text-archer-light-text/70 hover:text-archer-light-text hover:border-archer-light-text/30'
              }`}
              onClick={() => setActiveMainTab('evolution')}
            >
              Long-Term Evolution
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-archer-dark-text">Loading your progress data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-600 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeMainTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Readiness Score */}
                  <div className="bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-6">
                    <h2 className="text-xl font-semibold text-archer-white mb-6">NCLEX Readiness Score</h2>
                    <div className="flex justify-center mb-6">
                      <div className="relative h-48 w-48">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-archer-bright-teal">{readinessScore.overallScore}%</div>
                            <div className="text-archer-light-text/70">Ready</div>
                          </div>
                        </div>
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--border-color-dark)"
                            strokeWidth="3"
                            strokeDasharray="100, 100"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--archer-bright-teal)"
                            strokeWidth="3"
                            strokeDasharray={`${readinessScore.overallScore}, 100`}
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-archer-light-text/80 mb-2">
                        Your exam is in <span className="font-medium text-archer-light-text">{daysUntilExam} days</span>
                      </p>
                      <p className="text-sm text-archer-light-text/80">
                        Projected score: <span className="font-medium text-archer-light-text">{readinessScore.projectedScore}%</span>
                      </p>
                    </div>
                  </div>

                  {/* Task Completion */}
                  <div className="bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-6">
                    <h2 className="text-xl font-semibold text-archer-white mb-6">Task Completion</h2>
                    <div className="flex justify-center mb-6">
                      <div className="relative h-40 w-40">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-archer-bright-teal">{Math.round((completedTasks.completed / completedTasks.total) * 100)}%</div>
                            <div className="text-sm text-archer-light-text/70">Completed</div>
                            <div className="text-xs text-archer-light-text/50 mt-1">{completedTasks.completed} of {completedTasks.total} tasks</div>
                          </div>
                        </div>
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--border-color-dark)"
                            strokeWidth="3"
                            strokeDasharray="100, 100"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="var(--archer-bright-teal)"
                            strokeWidth="3"
                            strokeDasharray={`${Math.round((completedTasks.completed / completedTasks.total) * 100)}, 100`}
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {completedTasks.byType.map((type) => (
                        <div key={type.type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-archer-light-text/80">{type.type.charAt(0) + type.type.slice(1).toLowerCase()}</span>
                            <span className="font-medium text-archer-light-text">{type.completed} of {type.total}</span>
                          </div>
                          <div className="w-full bg-archer-dark-teal rounded-full h-2">
                            <div
                              className={`${getTaskTypeColor(type.type)} h-2 rounded-full`}
                              style={{ width: `${(type.completed / type.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Charts */}
                <PerformanceCharts
                  performanceHistory={performanceHistory}
                  categoryScores={readinessScore.categoryScores}
                  overallScore={readinessScore.overallScore}
                />

                {/* Strengths & Weaknesses */}
                <div className="bg-card-background-dark rounded-xl shadow-md border border-border-color-dark p-6 mb-6">
                  <h2 className="text-xl font-semibold text-archer-white mb-6">Strengths & Weaknesses</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-md font-medium text-archer-light-text mb-3">Areas to Improve</h3>
                      <div className="space-y-4">
                        {readinessScore.weakAreas.map((area, index) => (
                          <div key={index} className="bg-card-background-lighter rounded-lg p-4 shadow-card">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-card-background-dark flex items-center justify-center mr-3 shadow-sm">
                                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <h4 className="font-medium text-archer-light-text">{area.name}</h4>
                              </div>
                              <span className="text-sm font-medium text-archer-light-text">
                                {area.score}%
                              </span>
                            </div>
                            <p className="text-sm text-archer-light-text/70 ml-13 pl-1">
                              Focus on improving your knowledge in this area. Consider reviewing related content and taking more practice quizzes.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-archer-light-text mb-3">Strong Areas</h3>
                      <div className="space-y-4">
                        {readinessScore.strongAreas.map((area, index) => (
                          <div key={index} className="bg-card-background-lighter rounded-lg p-4 shadow-card">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-card-background-dark flex items-center justify-center mr-3 shadow-sm">
                                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <h4 className="font-medium text-archer-light-text">{area.name}</h4>
                              </div>
                              <span className="text-sm font-medium text-archer-light-text">
                                {area.score}%
                              </span>
                            </div>
                            <p className="text-sm text-archer-light-text/70 ml-13 pl-1">
                              You're doing well in this area! Continue to maintain your knowledge with periodic review.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitor Agent Insights */}
                <MonitorInsights userId="6818ed80539a47f3e1d5b9ab" />
              </div>
            )}

            {/* Performance by Topic Tab */}
            {activeMainTab === 'performance' && (
              <TopicBreakdown topics={topics} />
            )}

            {/* Readiness Details Tab */}
            {activeMainTab === 'readiness' && (
              <ReadinessDetails
                overallScore={readinessScore.overallScore}
                projectedScore={readinessScore.projectedScore}
                daysUntilExam={daysUntilExam}
                weakAreas={readinessScore.weakAreas}
                strongAreas={readinessScore.strongAreas}
              />
            )}

            {/* Plan Adaptations Tab */}
            {activeMainTab === 'adaptations' && (
              <PlanAdaptations adaptations={adaptations} />
            )}

            {/* Evolution Tab */}
            {activeMainTab === 'evolution' && (
              <div>
                {/* Evolution Tab Navigation */}
                <div className="mb-6 bg-card-background-dark rounded-lg p-4 shadow-card">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setEvolutionSubTab('trends')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'trends'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Long-Term Trends
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('versions')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'versions'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Plan Versions
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('predictions')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'predictions'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Predictive Performance
                    </button>
                    <button
                      onClick={() => setEvolutionSubTab('reviews')}
                      className={`px-4 py-2 rounded-lg text-sm shadow-button ${
                        evolutionSubTab === 'reviews'
                          ? 'bg-archer-bright-teal text-archer-dark-bg'
                          : 'bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70'
                      }`}
                    >
                      Plan Reviews
                    </button>
                  </div>
                </div>

                {/* Evolution Tab Content */}
                {evolutionSubTab === 'trends' && (
                  <LongTermTrends userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'versions' && (
                  <PlanVersionManagement userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'predictions' && (
                  <PredictivePerformance userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}

                {evolutionSubTab === 'reviews' && (
                  <PlanReviewOptimization userId={authUser?.id || localStorage.getItem('userId') || '6818ed80539a47f3e1d5b9ab'} />
                )}
              </div>
            )}
          </>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
