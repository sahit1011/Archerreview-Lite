'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function TestDashboardViewPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState({
    overallScore: 0,
    categoryScores: [] as { category: string; score: number }[],
    weakAreas: [] as any[],
    strongAreas: [] as any[]
  });
  const [user, setUser] = useState<any>(null);
  const [focusAreas, setFocusAreas] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get user ID from URL query parameter
        const userId = searchParams.get('userId');
        console.log('User ID from URL:', userId);

        let user;

        if (userId) {
          console.log('Fetching specific user with ID:', userId);
          // Get the specific user
          const userResponse = await fetch(`/api/users/${userId}`);
          const userData = await userResponse.json();
          console.log('User API response:', userData);

          if (!userData.success) {
            console.error('Failed to fetch user:', userData);
            throw new Error('Failed to fetch the selected user.');
          }

          user = userData.user;
          console.log('Selected user:', user);
        } else {
          console.log('No user ID found in URL, fetching first user');
          // Get the first user (for demo purposes)
          const usersResponse = await fetch('/api/users');
          const usersData = await usersResponse.json();

          if (!usersData.success || !usersData.users || !usersData.users.length) {
            throw new Error('No users found. Please create a user first.');
          }

          user = usersData.users[0];
          console.log('Using first user:', user);
        }

        setUser(user);

        // Get the user's study plan
        const planResponse = await fetch(`/api/study-plans?userId=${user._id}`);
        const planData = await planResponse.json();

        if (!planData.success || !planData.studyPlan) {
          throw new Error('No study plan found for this user.');
        }

        // Get today's tasks
        const today = new Date();
        const formattedDate = format(today, 'yyyy-MM-dd');
        console.log(`Fetching tasks for plan: ${planData.studyPlan._id} and date: ${formattedDate}`);
        const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}&date=${formattedDate}`);
        const tasksData = await tasksResponse.json();
        console.log('Tasks API response:', tasksData);

        if (tasksData.success) {
          setTodaysTasks(tasksData.tasks || []);
          console.log(`Set ${tasksData.tasks?.length || 0} tasks for today`);
        }

        // Get readiness score
        console.log(`Fetching readiness score for user: ${user._id}`);
        const readinessResponse = await fetch(`/api/readiness-score?userId=${user._id}`);
        const readinessData = await readinessResponse.json();
        console.log('Readiness score API response:', readinessData);

        if (readinessData.success) {
          const readinessScoreData = readinessData.readinessScore || {
            overallScore: 0,
            categoryScores: [],
            weakAreas: [],
            strongAreas: []
          };

          setReadinessScore(readinessScoreData);
          console.log(`Set readiness score: ${readinessScoreData.overallScore}%`);

          // Set focus areas based on weak and strong areas
          const areas = [
            ...(readinessData.readinessScore?.weakAreas || []).map((area: any) => ({
              ...area,
              type: 'weak',
              message: 'This area needs improvement. Focus on strengthening your knowledge here.'
            })),
            ...(readinessData.readinessScore?.strongAreas || []).slice(0, 1).map((area: any) => ({
              ...area,
              type: 'strong',
              message: 'You\'re doing well here! Continue practicing to maintain your strong performance.'
            }))
          ];

          setFocusAreas(areas);
          console.log(`Set ${areas.length} focus areas`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams]);

  // Get task icon based on type
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'QUIZ':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'READING':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'PRACTICE':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'REVIEW':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get task background color based on type
  const getTaskBgColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 text-blue-600';
      case 'QUIZ':
        return 'bg-orange-100 text-orange-600';
      case 'READING':
        return 'bg-green-100 text-green-600';
      case 'PRACTICE':
        return 'bg-purple-100 text-purple-600';
      case 'REVIEW':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get focus area background color based on type
  const getFocusAreaBgColor = (type: string) => {
    switch (type) {
      case 'weak':
        return 'bg-red-100 text-red-600';
      case 'strong':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  // Get category score color based on score
  const getCategoryScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle refreshing focus areas
  const handleRefreshFocusAreas = async () => {
    if (!user) return;

    try {
      // Recalculate readiness score
      const response = await fetch('/api/readiness-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();

      if (data.success) {
        setReadinessScore(data.readinessScore);

        // Update focus areas
        const areas = [
          ...(data.readinessScore?.weakAreas || []).map((area: any) => ({
            ...area,
            type: 'weak',
            message: 'This area needs improvement. Focus on strengthening your knowledge here.'
          })),
          ...(data.readinessScore?.strongAreas || []).slice(0, 1).map((area: any) => ({
            ...area,
            type: 'strong',
            message: 'You\'re doing well here! Continue practicing to maintain your strong performance.'
          }))
        ];

        setFocusAreas(areas);
      }
    } catch (err) {
      console.error('Error refreshing focus areas:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <Link href="/test-dashboard" className="text-red-600 hover:text-red-800 font-medium">
              Back to Test Dashboard →
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}! Here's your study plan for today.
          <Link href="/test-dashboard" className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Back to Test Dashboard
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Today's Tasks</h2>
              <span className="text-sm text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks for today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.name === "New User"
                    ? "You don't have any tasks scheduled yet. Your study plan will be generated soon."
                    : "You don't have any tasks scheduled for today."}
                </p>
                <div className="mt-6">
                  <Link
                    href={`/test-calendar?userId=${user?._id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Calendar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysTasks.map((task) => (
                  <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full ${getTaskBgColor(task.type)} flex items-center justify-center mr-3`}>
                          {getTaskIcon(task.type)}
                        </div>
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <div className="text-sm text-gray-500">
                            {task.type === 'QUIZ' ? `${task.description} • ${task.duration} minutes` : task.description}
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {format(new Date(task.startTime), 'h:mm a')}
                      </div>
                    </div>
                    {task.status !== 'PENDING' && (
                      <div className="mt-2 flex justify-end">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                          task.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-center">
              <Link
                href={`/test-calendar?userId=${user?._id}`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View Full Schedule →
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">NCLEX Readiness</h2>
            <div className="flex justify-center mb-4">
              <div className="relative h-36 w-36">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{readinessScore.overallScore}%</div>
                    <div className="text-sm text-gray-500">Ready</div>
                  </div>
                </div>
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeDasharray={`${readinessScore.overallScore}, 100`}
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {readinessScore.categoryScores.slice(0, 3).map((category) => (
                <div key={category.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}</span>
                    <span className="font-medium">{category.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${getCategoryScoreColor(category.score)} h-2 rounded-full`} style={{ width: `${category.score}%` }}></div>
                  </div>
                </div>
              ))}

              {readinessScore.categoryScores.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    {user?.name === "New User"
                      ? "Complete some tasks to see your readiness score."
                      : "No category scores available yet."}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link
                href={`/test-calendar?userId=${user?._id}`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View Detailed Progress →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Countdown</h2>
            <div className="text-center">
              {user?.examDate ? (
                <>
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-gray-600">Days Remaining</div>
                  <div className="mt-4 text-sm text-gray-500">
                    Exam Date: {format(new Date(user.examDate), 'MMMM d, yyyy')}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 py-4">
                  No exam date set.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recommended Focus Areas</h2>
          <button
            onClick={handleRefreshFocusAreas}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {focusAreas.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No focus areas yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.name === "New User"
                ? "Complete some tasks to get personalized focus area recommendations."
                : "Complete more tasks to get personalized focus area recommendations."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focusAreas.map((area, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center mb-2">
                  <div className={`h-8 w-8 rounded-full ${getFocusAreaBgColor(area.type)} flex items-center justify-center mr-3`}>
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      {area.type === 'weak' ? (
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      )}
                    </svg>
                  </div>
                  <h3 className="font-medium">{area.name}</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {area.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
