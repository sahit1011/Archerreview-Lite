'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import InteractiveCalendar from '@/components/calendar/InteractiveCalendar';
import LazyTaskDetailPopover from '@/components/calendar/LazyTaskDetailPopover';
import TaskCreationModal from '@/components/calendar/TaskCreationModal';
import CalendarFilters, { FilterOptions } from '@/components/calendar/CalendarFilters';
import CalendarSkeleton from '@/components/calendar/CalendarSkeleton';
import { getDateRangeForView, hasDateRangeChanged } from '@/utils/dateUtils';
import { getCacheItem, setCacheItem, generateTasksCacheKey } from '@/utils/cacheUtils';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [initialView, setInitialView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('dayGridMonth');
  const [currentView, setCurrentView] = useState<string>(initialView);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTaskCreationModalOpen, setIsTaskCreationModalOpen] = useState(false);
  const [taskCreationDate, setTaskCreationDate] = useState<Date | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Refs for tracking previous date range
  const prevDateRangeRef = useRef<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const [filters, setFilters] = useState<FilterOptions>(() => {
    // Load filters from localStorage if available
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('calendarFilters');
      if (savedFilters) {
        try {
          return JSON.parse(savedFilters);
        } catch (e) {
          console.error('Error parsing saved filters:', e);
        }
      }
    }

    // Default filters
    return {
      taskTypes: [],
      taskStatuses: [],
      topicIds: [],
      hideCompleted: false
    };
  });
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // Get user data only once on initial load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get user ID from URL query parameter first, then from localStorage
        let userId = searchParams.get('userId');

        // If no userId in URL, try to get from localStorage
        if (!userId && typeof window !== 'undefined') {
          userId = localStorage.getItem('userId');
        }

        if (!userId) {
          throw new Error('No user ID found. Please select a user first.');
        }

        // Get the specific user
        const userResponse = await fetch(`/api/users/${userId}`);
        const userData = await userResponse.json();

        if (!userData.success) {
          throw new Error('Failed to fetch the selected user.');
        }

        setUser(userData.user);

        // Store the user ID in localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', userId);
        }

        // Get the user's study plan
        const planResponse = await fetch(`/api/study-plans?userId=${userData.user._id}`);
        const planData = await planResponse.json();

        if (!planData.success || !planData.studyPlan) {
          throw new Error('No study plan found for this user.');
        }

        setStudyPlan(planData.studyPlan);
        setIsInitialLoad(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [searchParams]);

  // Handle view change
  const handleViewChange = (newView: string) => {
    setCurrentView(newView);

    // Calculate new date range based on the view
    const newDateRange = getDateRangeForView(selectedDate, newView, 7); // Add 7 days padding
    setDateRange(newDateRange);
  };

  // Optimized fetchTasks function with date range limiting and caching
  const fetchTasks = useCallback(async () => {
    if (!studyPlan || !user) return;

    try {
      setLoading(true);

      // Calculate date range if not already set
      const viewDateRange = dateRange || getDateRangeForView(selectedDate, currentView, 7);

      // Check if we need to refetch based on date range change
      const shouldRefetch = hasDateRangeChanged(
        prevDateRangeRef.current.start,
        prevDateRangeRef.current.end,
        viewDateRange.start,
        viewDateRange.end
      );

      // Update the previous date range ref
      prevDateRangeRef.current = {
        start: viewDateRange.start,
        end: viewDateRange.end
      };

      // Format dates for API
      const formattedStartDate = format(viewDateRange.start, 'yyyy-MM-dd');
      const formattedEndDate = format(viewDateRange.end, 'yyyy-MM-dd');

      // Generate cache key
      const cacheKey = generateTasksCacheKey(studyPlan._id, viewDateRange.start, viewDateRange.end);

      // Try to get from cache first
      let tasksData;
      if (!shouldRefetch) {
        const cachedTasks = getCacheItem<any>(cacheKey);
        if (cachedTasks) {
          console.log('Using cached tasks data');
          setTasks(cachedTasks);
          setLoading(false);

          // Still fetch tasks for the selected date
          await fetchTasksForDate();
          return;
        }
      }

      // Fetch tasks with date range limiting
      console.log(`Fetching tasks from ${formattedStartDate} to ${formattedEndDate}`);
      const tasksResponse = await fetch(
        `/api/tasks?planId=${studyPlan._id}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      tasksData = await tasksResponse.json();

      if (tasksData.success) {
        setTasks(tasksData.tasks || []);

        // Cache the tasks data
        setCacheItem(cacheKey, tasksData.tasks || []);
      }

      // Fetch tasks for the selected date
      await fetchTasksForDate();

      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading tasks');
      setLoading(false);
    }
  }, [studyPlan, selectedDate, currentView, dateRange, user]);

  // Fetch tasks for a specific date
  const fetchTasksForDate = async () => {
    if (!studyPlan || !user) return;

    try {
      // Generate cache key for today's tasks
      const cacheKey = `calendar_today_tasks_${studyPlan._id}_${format(selectedDate, 'yyyy-MM-dd')}`;

      // Try to get from cache first
      const cachedTasks = getCacheItem<any>(cacheKey);
      if (cachedTasks) {
        console.log('Using cached today\'s tasks data');
        setTodaysTasks(cachedTasks);
        return;
      }

      // Get tasks for the selected date
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const selectedDateTasksResponse = await fetch(`/api/tasks?planId=${studyPlan._id}&date=${formattedDate}`);
      const selectedDateTasksData = await selectedDateTasksResponse.json();

      if (selectedDateTasksData.success) {
        setTodaysTasks(selectedDateTasksData.tasks || []);

        // Cache the tasks data
        setCacheItem(cacheKey, selectedDateTasksData.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks for date:', err);
    }
  };

  // Fetch topics for filters
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user) return;

      try {
        // Check cache first
        const cacheKey = 'calendar_topics';
        const cachedTopics = getCacheItem<any>(cacheKey);

        if (cachedTopics) {
          console.log('Using cached topics data');
          setTopics(cachedTopics);
          setTopicsLoading(false);
          return;
        }

        setTopicsLoading(true);
        const response = await fetch('/api/topics');
        const data = await response.json();

        if (data.success) {
          setTopics(data.topics || []);

          // Cache the topics data for 1 hour
          setCacheItem(cacheKey, data.topics || [], 60 * 60 * 1000);
        } else {
          console.error('Failed to fetch topics:', data.message);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, [user]);

  // Initialize date range when view or selected date changes
  useEffect(() => {
    const newDateRange = getDateRangeForView(selectedDate, currentView, 7);
    setDateRange(newDateRange);
  }, [selectedDate, currentView]);

  // Fetch tasks based on study plan and date range
  useEffect(() => {
    if (studyPlan && user && dateRange) {
      fetchTasks();
    }
  }, [studyPlan, user, dateRange, fetchTasks]);

  // Apply filters to tasks
  const applyFilters = useCallback((tasks: any[], filters: FilterOptions) => {
    return tasks.filter(task => {
      // Filter by task type
      if (filters.taskTypes.length > 0 && !filters.taskTypes.includes(task.type)) {
        return false;
      }

      // Filter by task status
      if (filters.taskStatuses.length > 0 && !filters.taskStatuses.includes(task.status)) {
        return false;
      }

      // Filter by topic
      if (filters.topicIds.length > 0) {
        const topicId = task.topic?._id || task.topic;
        if (!filters.topicIds.includes(topicId)) {
          return false;
        }
      }

      // Hide completed tasks
      if (filters.hideCompleted && task.status === 'COMPLETED') {
        return false;
      }

      return true;
    });
  }, []);

  // Update filtered tasks when tasks or filters change
  useEffect(() => {
    const filtered = applyFilters(tasks, filters);
    setFilteredTasks(filtered);

    // Save filters to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarFilters', JSON.stringify(filters));
    }
  }, [tasks, filters, applyFilters]);

  // Filter today's tasks based on the same filters
  const filteredTodaysTasks = useMemo(() => {
    return applyFilters(todaysTasks, filters);
  }, [todaysTasks, filters, applyFilters]);

  // Handle task update (drag and drop)
  const handleTaskUpdate = async (taskId: string, startTime: Date, endTime: Date) => {
    try {
      console.log(`Updating task ${taskId}:`, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update task');
      }

      console.log(`Task ${taskId} updated successfully:`, data.task);

      // Update the task in the local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, startTime: startTime.toISOString(), endTime: endTime.toISOString() }
            : task
        )
      );

      // Also update today's tasks if the task is in today's list
      setTodaysTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, startTime: startTime.toISOString(), endTime: endTime.toISOString() }
            : task
        )
      );

      // Invalidate cache for the affected date ranges
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('calendar_tasks_') || key.startsWith('calendar_today_tasks_')) {
            localStorage.removeItem(key);
          }
        });
      }

      return data.task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  // Get background color based on task type - matching demo dashboard colors
  const getTaskBgColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-100 text-blue-800';
      case 'QUIZ':
        return 'bg-purple-100 text-purple-800';
      case 'READING':
        return 'bg-green-100 text-green-800';
      case 'PRACTICE':
        return 'bg-amber-100 text-amber-800';
      case 'REVIEW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get badge background color for task type
  const getTaskBadgeBgColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-blue-200 text-blue-800';
      case 'QUIZ':
        return 'bg-purple-200 text-purple-800';
      case 'READING':
        return 'bg-green-200 text-green-800';
      case 'PRACTICE':
        return 'bg-amber-200 text-amber-800';
      case 'REVIEW':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Get icon based on task type
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
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Navigation functions
  const goToPreviousDay = () => {
    const prevDay = subDays(selectedDate, 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Toggle date picker
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update task status');
      }

      // Update the task in the local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );

      // Also update today's tasks if the task is in today's list
      setTodaysTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );

      // Invalidate cache for the affected date ranges
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('calendar_tasks_') || key.startsWith('calendar_today_tasks_')) {
            localStorage.removeItem(key);
          }
        });
      }

      return data.task;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  // Handle opening the task creation modal
  const handleAddTask = (date: Date) => {
    setTaskCreationDate(date);
    setIsTaskCreationModalOpen(true);
  };

  // Handle task creation
  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create task');
      }

      // Invalidate cache for the affected date ranges
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('calendar_tasks_') || key.startsWith('calendar_today_tasks_')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Refresh tasks after creating a new one
      await fetchTasks();

      return data.task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Handle resetting the schedule
  const handleResetSchedule = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const response = await fetch('/api/study-plans/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();

      if (data.success) {
        // Invalidate all calendar cache
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('calendar_')) {
              localStorage.removeItem(key);
            }
          });
        }

        // Reload tasks
        await fetchTasks();
        alert('Your schedule has been reset to the original plan.');
      } else {
        console.error('Failed to reset schedule:', data.message);
        alert('Failed to reset schedule. Please try again later.');
      }
    } catch (err) {
      console.error('Error resetting schedule:', err);
      alert('An error occurred while resetting your schedule. Please try again later.');
    } finally {
      setLoading(false);
      setResetConfirmOpen(false);
    }
  };

  // Loading state
  if (loading && isInitialLoad) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </AppLayout>
    );
  }

  // Error state
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
            <Link href="/dashboard" className="text-red-600 hover:text-red-800 font-medium">
              Back to Dashboard →
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Main render
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Calendar header with filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Reset Schedule
              </button>
            </div>
          </div>

          {/* Filters */}
          <CalendarFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            topics={topics}
            loading={topicsLoading}
          />

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <InteractiveCalendar
                tasks={filteredTasks}
                onTaskClick={setSelectedTaskId}
                onTaskUpdate={handleTaskUpdate}
                onViewChange={handleViewChange}
                onDateSelect={handleDateSelect}
                onAddTask={handleAddTask}
                initialView={initialView}
                selectedDate={selectedDate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Task detail popover */}
      <LazyTaskDetailPopover
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={handleTaskStatusChange}
      />

      {/* Task creation modal */}
      <TaskCreationModal
        isOpen={isTaskCreationModalOpen}
        onClose={() => setIsTaskCreationModalOpen(false)}
        onCreateTask={handleCreateTask}
        initialDate={taskCreationDate}
        planId={studyPlan?._id}
        topics={topics}
      />

      {/* Reset confirmation dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900">Reset Schedule</h3>
            <p className="mt-2 text-gray-600">
              Are you sure you want to reset your schedule to the original plan? This will remove all custom tasks and revert any changes you've made.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSchedule}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}