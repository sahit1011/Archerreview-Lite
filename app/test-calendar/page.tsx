'use client';

import { useState, useEffect, Suspense } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TestCalendarContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    const fetchCalendarData = async () => {
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

          if (!usersData.success || !usersData.users || usersData.users.length === 0) {
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

        setStudyPlan(planData.studyPlan);
        console.log('Study plan:', planData.studyPlan);

        // Get tasks for the selected date range
        let startDate, endDate;

        if (viewMode === 'day') {
          startDate = selectedDate;
          endDate = selectedDate;
        } else if (viewMode === 'week') {
          // Get the start of the week (Sunday)
          const day = selectedDate.getDay();
          startDate = addDays(selectedDate, -day);
          endDate = addDays(startDate, 6);
        } else {
          // Month view - simplified for demo
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        }

        const formattedStartDate = format(startDate, 'yyyy-MM-dd');
        const formattedEndDate = format(endDate, 'yyyy-MM-dd');

        console.log(`Fetching tasks for plan: ${planData.studyPlan._id} from ${formattedStartDate} to ${formattedEndDate}`);

        const tasksResponse = await fetch(`/api/tasks?planId=${planData.studyPlan._id}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
        const tasksData = await tasksResponse.json();
        console.log('Tasks API response:', tasksData);

        if (tasksData.success) {
          setTasks(tasksData.tasks || []);
          console.log(`Set ${tasksData.tasks?.length || 0} tasks`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading calendar data');
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [searchParams, selectedDate, viewMode]);

  // Get task background color based on type
  const getTaskBgColor = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 border-l-4 border-blue-500';
      case 'QUIZ':
        return 'bg-orange-100 border-l-4 border-orange-500';
      case 'READING':
        return 'bg-purple-100 border-l-4 border-purple-500';
      case 'PRACTICE':
        return 'bg-green-100 border-l-4 border-green-500';
      case 'REVIEW':
        return 'bg-indigo-100 border-l-4 border-indigo-500';
      default:
        return 'bg-gray-100 border-l-4 border-gray-500';
    }
  };

  const handlePrevDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
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

  // Group tasks by hour for day view
  const tasksByHour = Array.from({ length: 12 }).map((_, i) => {
    const hour = 8 + i; // Start at 8 AM
    const tasksAtHour = tasks.filter(task => {
      const taskHour = new Date(task.startTime).getHours();
      return taskHour === hour;
    });
    return {
      hour,
      tasks: tasksAtHour
    };
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Study Calendar</h1>
        <p className="text-gray-600">
          Viewing {user?.name}'s personalized study schedule.
          {studyPlan && (
            <span className="ml-2 text-indigo-600">
              Exam Date: {format(new Date(user.examDate), 'MMMM d, yyyy')}
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 ${viewMode === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-md text-sm`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={`px-3 py-1 ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-md text-sm`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-md text-sm`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={handlePrevDay}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-gray-700 font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
            <button
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={handleNextDay}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
              onClick={handleToday}
            >
              Today
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 divide-y">
            {tasksByHour.map(({ hour, tasks }) => {
              const hourFormatted = hour > 12 ? hour - 12 : hour;
              const ampm = hour >= 12 ? 'PM' : 'AM';

              return (
                <div key={hour} className="grid grid-cols-12 h-20">
                  <div className="col-span-1 border-r p-2 flex flex-col justify-center items-center text-gray-500 text-sm">
                    <div>{hourFormatted}</div>
                    <div>{ampm}</div>
                  </div>
                  <div className="col-span-11 p-1 relative">
                    {tasks.map(task => (
                      <div
                        key={task._id}
                        className={`absolute inset-y-1 left-1 right-1 rounded-md p-2 ${getTaskBgColor(task.type)}`}
                      >
                        <div className="font-medium text-gray-800">{task.title}</div>
                        <div className="text-xs text-gray-600">{task.duration} minutes</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          {tasks.length === 0 ? (
            <div className="py-4">
              <p>No tasks scheduled for this day.</p>
              {user?.name === "New User" && (
                <p className="mt-2">This user doesn't have any tasks scheduled yet.</p>
              )}
            </div>
          ) : (
            <p>Showing {tasks.length} tasks for {format(selectedDate, 'MMMM d, yyyy')}.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">User Study Plan Summary</h2>

        {studyPlan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Plan Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{format(new Date(studyPlan.startDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{format(new Date(studyPlan.endDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Personalized:</span>
                    <span className="font-medium">{studyPlan.isPersonalized ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Study Schedule</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Days:</span>
                    <span className="font-medium">{user.preferences?.availableDays?.join(', ') || 'All days'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hours Per Day:</span>
                    <span className="font-medium">{user.preferences?.studyHoursPerDay || '2'} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Time:</span>
                    <span className="font-medium">{user.preferences?.preferredStudyTime || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Progress</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Until Exam:</span>
                    <span className="font-medium">
                      {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tasks:</span>
                    <span className="font-medium">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Tasks:</span>
                    <span className="font-medium">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/test-dashboard"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                ← Back to Test Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No study plan found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This user doesn't have a study plan yet.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function TestCalendarPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </AppLayout>
    }>
      <TestCalendarContent />
    </Suspense>
  );
}