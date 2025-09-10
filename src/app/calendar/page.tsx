'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import InteractiveCalendar from '@/components/calendar/InteractiveCalendar';
import TaskDetailPopover from '@/components/calendar/TaskDetailPopover';
import TaskCreationModal from '@/components/calendar/TaskCreationModal';
import CalendarFilters, { FilterOptions } from '@/components/calendar/CalendarFilters';
import AlertButton from '@/components/common/AlertButton';
import DuplicateSessionsCleanupButton from '@/components/calendar/DuplicateSessionsCleanupButton';
import ClientOnly from '@/components/common/ClientOnly';
import ParticleBackground from '@/components/common/ParticleBackground';
import { fadeIn, fadeInUp, staggerContainer } from '@/utils/animationUtils';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTaskCreationModalOpen, setIsTaskCreationModalOpen] = useState(false);
  const [taskCreationDate, setTaskCreationDate] = useState<Date | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>(() => {
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
    return {
      taskTypes: [],
      taskStatuses: [],
      topicIds: [],
      hideCompleted: false
    };
  });
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let userId = searchParams.get('userId');
        if (!userId && typeof window !== 'undefined') {
          userId = localStorage.getItem('userId');
        }
        if (!userId) {
          throw new Error('No user ID found. Please select a user first.');
        }
        const userResponse = await fetch(`/api/users/${userId}`);
        const userData = await userResponse.json();
        if (!userData.success) {
          throw new Error('Failed to fetch the selected user.');
        }
        setUser(userData.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', userId);
        }
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

  const fetchTasks = useCallback(async () => {
    if (!studyPlan || !user) return;
    try {
      setLoading(true);
      
      // Fetch all tasks in a single API call
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const tasksResponse = await fetch(`/api/tasks?planId=${studyPlan._id}`);
      
      if (!tasksResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${tasksResponse.status} ${tasksResponse.statusText}`);
      }
      
      const tasksData = await tasksResponse.json();
      
      if (tasksData.success) {
        console.log(`[CalendarPage] Fetched tasks. Total tasks: ${tasksData.tasks?.length || 0}`);
        setTasks(tasksData.tasks || []);
        
        // Filter today's tasks from all tasks instead of making a separate API call
        const todaysTasks = tasksData.tasks?.filter(task => {
          const taskDate = format(new Date(task.startTime), 'yyyy-MM-dd');
          return taskDate === formattedDate;
        }) || [];
        
        setTodaysTasks(todaysTasks);
      } else {
        throw new Error(tasksData.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading tasks');
    } finally {
      setLoading(false);
    }
  }, [studyPlan, user, selectedDate]);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!user) return;
      try {
        setTopicsLoading(true);
        const response = await fetch('/api/topics');
        const data = await response.json();
        if (data.success) {
          setTopics(data.topics || []);
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

  useEffect(() => {
    fetchTasks();
  }, [studyPlan, user, fetchTasks]);

  const applyFilters = useCallback((tasksToFilter: any[], currentFilters: FilterOptions) => {
    return tasksToFilter.filter(task => {
      if (currentFilters.taskTypes.length > 0 && !currentFilters.taskTypes.includes(task.type)) return false;
      if (currentFilters.taskStatuses.length > 0 && !currentFilters.taskStatuses.includes(task.status)) return false;
      if (currentFilters.topicIds.length > 0) {
        const topicId = task.topic?._id || task.topic;
        if (!currentFilters.topicIds.includes(topicId)) return false;
      }
      if (currentFilters.hideCompleted && task.status === 'COMPLETED') return false;
      return true;
    });
  }, []);

  useEffect(() => {
    const newFilteredTasks = applyFilters(tasks, filters);
    setFilteredTasks(newFilteredTasks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendarFilters', JSON.stringify(filters));
    }
  }, [tasks, filters, applyFilters]);

  useEffect(() => {
    if (!studyPlan || !user) return;
    
    // Instead of making a separate API call, filter the tasks we already have
    const filterTasksForSelectedDate = () => {
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        // Filter tasks for the selected date
        const tasksForDate = tasks.filter(task => {
          const taskDate = format(new Date(task.startTime), 'yyyy-MM-dd');
          return taskDate === formattedDate;
        });
        
        setTodaysTasks(tasksForDate);
      } catch (err) {
        console.error('Error filtering tasks for date:', err);
      }
    };
    
    filterTasksForSelectedDate();
  }, [selectedDate, tasks, studyPlan, user]);

  const filteredTodaysTasks = useMemo(() => {
    return applyFilters(todaysTasks, filters);
  }, [todaysTasks, filters, applyFilters]);

  const handleTaskUpdate = async (taskId: string, startTime: Date, endTime: Date) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: startTime.toISOString(), endTime: endTime.toISOString() }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update task');
      console.log(`[CalendarPage] Task ${taskId} updated. New start: ${startTime}, New end: ${endTime}.`);
      setTasks(prevTasks => prevTasks.map(task => task._id === taskId ? { ...task, startTime: startTime.toISOString(), endTime: endTime.toISOString() } : task));
      setTodaysTasks(prevTasks => prevTasks.map(task => task._id === taskId ? { ...task, startTime: startTime.toISOString(), endTime: endTime.toISOString() } : task));
      return data.task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  // Get background color and text color based on task type - using theme variables
  const getTaskStyleClasses = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-archer-light-blue/20 text-archer-light-blue';
      case 'QUIZ':
        return 'bg-archer-bright-teal/20 text-archer-bright-teal';
      case 'READING':
        return 'bg-green-400/20 text-green-400';
      case 'PRACTICE':
        return 'bg-amber-400/20 text-amber-400';
      case 'REVIEW':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-archer-light-text/10 text-archer-light-text';
    }
  };

  // Get badge background color and text color for task type - using theme variables
  const getTaskBadgeStyleClasses = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-archer-light-blue/30 text-archer-light-blue';
      case 'QUIZ':
        return 'bg-archer-bright-teal/30 text-archer-bright-teal';
      case 'READING':
        return 'bg-green-400/30 text-green-400';
      case 'PRACTICE':
        return 'bg-amber-400/30 text-amber-400';
      case 'REVIEW':
        return 'bg-red-400/30 text-red-400';
      default:
        return 'bg-archer-light-text/20 text-archer-light-text';
    }
  };

  // Get task icon color based on type
  const getTaskIconColor = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'text-blue-500';
      case 'QUIZ':
        return 'text-archer-bright-teal';
      case 'READING':
        return 'text-green-500';
      case 'PRACTICE':
        return 'text-amber-500';
      case 'REVIEW':
        return 'text-red-500';
      default:
        return 'text-archer-light-text';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>;
      case 'QUIZ': return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
      case 'READING': return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>;
      case 'PRACTICE': return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" /></svg>;
      case 'REVIEW': return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg>;
      default: return <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
    }
  };

  const goToPreviousDay = () => { const prevDay = new Date(selectedDate); prevDay.setDate(prevDay.getDate() - 1); setSelectedDate(prevDay); };
  const goToNextDay = () => { const nextDay = new Date(selectedDate); nextDay.setDate(nextDay.getDate() + 1); setSelectedDate(nextDay); };
  const goToToday = () => setSelectedDate(new Date());
  const toggleDatePicker = () => setShowDatePicker(!showDatePicker);
  const handleDateSelect = (date: Date) => { setSelectedDate(date); setShowDatePicker(false); };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      console.log(`Attempting to update task ${taskId} status to ${newStatus}`);

      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      // Check if the response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with status ${response.status}:`, errorText);

        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          // If parsing fails, use the status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update task status');
      }

      console.log(`Task status update successful:`, data);

      // Update the task in the tasks state
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

      // Update readiness score if it was returned
      if (data.readinessScore) {
        // We don't have direct access to setReadinessScore here,
        // but the score will be updated next time the dashboard is loaded
        console.log('Readiness score updated:', data.readinessScore.overallScore);
      }

      console.log(`Task ${taskId} status updated to ${newStatus}`);
      return data.task;
    } catch (error: any) {
      console.error('Error updating task status:', error);

      // Add more detailed logging to help diagnose the issue
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers
        });
      }

      throw error;
    }
  };

  const handleAddTask = (date: Date) => {
    setTaskCreationDate(date);
    setIsTaskCreationModalOpen(true);
  };
  
  const handleCreateTask = async (taskData: any) => {
    /* Implementation omitted for brevity */
  };
  
  const handleFilterChange = (newFilters: FilterOptions) => setFilters(newFilters);

  // State for reset confirmation dialog
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

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

  if (loading && isInitialLoad) {
    return <AppLayout><div className="flex flex-col items-center justify-center h-64"><div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div><p className="mt-4 text-gray-600">Loading your calendar...</p></div></AppLayout>;
  }

  if (error) {
    return <AppLayout><div className="bg-red-100 border border-red-300 text-red-600 rounded-lg p-4 mb-6"><div className="flex"><svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><p>{error}</p></div><div className="mt-4"><Link href="/dashboard" className="text-red-600 hover:text-red-500 font-medium">Back to Dashboard →</Link></div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 -z-10"></div>
      <div className="relative z-0 min-h-screen text-white">
        {/* Enhanced Particle Background */}
        <ClientOnly>
          <ParticleBackground
            particleCount={80}
            colors={['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#0EA5E9']}
            className="opacity-60"
          />
        </ClientOnly>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mb-6 p-6"
        >
          <motion.div
            className="flex justify-between items-center"
            variants={fadeIn}
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight mb-2 flex items-center">
                <svg className="w-8 h-8 mr-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Study Calendar
              </h1>
              {user && (<p className="text-gray-400 text-lg">Viewing {user.name}'s personalized study schedule</p>)}
            </div>
            <div className="flex items-center space-x-4">
              {user && (<DuplicateSessionsCleanupButton userId={user._id} />)}
              {user && <AlertButton userId={user._id} position="top-right" />}
              {user && user.examDate && (
                <div className="glassmorphic-card rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-indigo-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm font-semibold text-indigo-300">Exam Date</div>
                  </div>
                  <div className="text-xl font-bold text-white mb-2">{format(new Date(user.examDate), 'MMM d, yyyy')}</div>
                  <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-md">
                    <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mb-6 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CalendarFilters onFilterChange={handleFilterChange} initialFilters={filters} topics={topics} topicsLoading={topicsLoading} />
        </motion.div>

        <motion.div
          className="mb-6 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <InteractiveCalendar
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={(taskId) => setSelectedTaskId(taskId)}
            onDateClick={(date) => setSelectedDate(date)}
            onAddTask={handleAddTask}
            selectedDate={selectedDate}
            initialView={initialView}
          />
          
          {/* Task Summary with Color Legend */}
          <div className="mt-4 glassmorphic-card rounded-lg p-4">
            <div className="flex flex-col space-y-4">
              {/* Task Count and Reset Button Row */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-300">
                  {filteredTasks.length !== tasks.length ? (
                    <><span className="font-medium text-indigo-400">{filteredTasks.length}</span> of <span className="font-medium text-white">{tasks.length}</span> tasks shown<span className="ml-2 text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-full">Filtered</span></>
                  ) : (
                    <><span className="font-medium text-indigo-400">{tasks.length}</span> tasks scheduled</>
                  )}
                </p>
                
                <div className="flex items-center gap-4">
                  <p className="text-gray-400 italic text-sm">Drag and drop to reschedule tasks</p>
                  <button
                    onClick={() => setResetConfirmOpen(true)}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex items-center shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Schedule
                  </button>
                </div>
              </div>
              
              {/* Centered Color Legend */}
              <div className="flex justify-center">
                <div className="flex flex-wrap justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500/60 border border-blue-400/40 backdrop-blur-sm"></div>
                    <span className="text-blue-300 font-medium">Video</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-teal-500/60 border border-teal-400/40 backdrop-blur-sm"></div>
                    <span className="text-teal-300 font-medium">Quiz</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-green-500/60 border border-green-400/40 backdrop-blur-sm"></div>
                    <span className="text-green-300 font-medium">Reading</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400/40 backdrop-blur-sm"></div>
                    <span className="text-amber-300 font-medium">Practice</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-pink-500/60 border border-pink-400/40 backdrop-blur-sm"></div>
                    <span className="text-pink-300 font-medium">Review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-400/40 backdrop-blur-sm"></div>
                    <span className="text-red-300 font-medium">Missed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glassmorphic-card rounded-xl overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
        <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "Today's Schedule" : "Schedule"}
            </h2>
            <div className="flex items-center space-x-3">
              <button onClick={goToPreviousDay} className="p-2 rounded-full bg-light-bg-secondary hover:bg-light-bg-gradient-end transition-all shadow-button" aria-label="Previous day"><svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <div className="relative">
                <button onClick={toggleDatePicker} className="flex items-center px-4 py-2 bg-archer-bright-teal text-white rounded-lg transition-all shadow-button hover:shadow-card-hover">
                  <span className="text-sm font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showDatePicker && (
                  <div className="absolute z-10 mt-2 right-0 bg-white rounded-lg shadow-card p-3 border border-gray-200">
                    <div className="p-2 border-b border-gray-200 mb-2"><button onClick={goToToday} className="w-full px-4 py-2 text-sm font-medium bg-archer-bright-teal text-white rounded-lg shadow-button hover:shadow-card-hover transition-all">Today</button></div>
                    <div className="p-2">
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-600 mb-2"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }, (_, i) => {
                          const d = new Date(selectedDate); d.setDate(1); const firstDay = d.getDay(); d.setDate(i - firstDay + 1);
                          const isCurrentMonth = d.getMonth() === selectedDate.getMonth();
                          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          return (<button key={i} onClick={() => handleDateSelect(new Date(d))} className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg shadow-button ${isCurrentMonth ? 'text-archer-light-text' : 'text-archer-light-text/40'} ${isToday ? 'bg-archer-light-blue text-white' : ''} ${isSelected ? 'bg-archer-bright-teal text-archer-dark-teal' : ''} ${!isSelected && !isToday && isCurrentMonth ? 'hover:bg-archer-dark-teal' : ''} ${!isSelected && !isToday && !isCurrentMonth ? 'hover:bg-archer-dark-teal/50' : ''}`}>{d.getDate()}</button>);
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={goToNextDay} className="p-2 rounded-full bg-light-bg-secondary hover:bg-light-bg-gradient-end transition-all shadow-button" aria-label="Next day"><svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-black/20 to-gray-900/20 backdrop-blur-sm">
          {todaysTasks.length === 0 ? (
            <div className="text-center py-8 glassmorphic-card rounded-lg p-6">
              <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <h3 className="mt-3 text-lg font-medium text-gray-300">No tasks for {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'today' : 'this day'}</h3>
              <p className="mt-2 text-gray-400">{user?.name === "New User" ? "You don't have any tasks scheduled yet. Your study plan will be generated soon." : format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "You don't have any tasks scheduled for today." : `You don't have any tasks scheduled for ${format(selectedDate, 'MMMM d, yyyy')}.`}</p>
            </div>
          ) : filteredTodaysTasks.length === 0 ? (
            <div className="text-center py-8 glassmorphic-card rounded-lg p-6">
              <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h3 className="mt-3 text-lg font-medium text-gray-300">No tasks match your filters</h3>
              <p className="mt-2 text-gray-400">Try adjusting your filter settings to see tasks for this day.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-4">
                {filteredTodaysTasks.map((task) => (
                  <div key={task._id} className="flex">
                    <div className="w-24 flex-shrink-0">
                      <div className="text-sm font-medium bg-gray-700 px-3 py-1.5 rounded-lg shadow-sm text-center text-gray-200 border border-gray-600">
                        {format(new Date(task.startTime), 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex-grow pl-4">
                      <div className="glassmorphic-card p-4 rounded-lg">
                        <div className="flex items-start">
                          <motion.div
                            className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mr-3 shadow-md border border-gray-600"
                            whileHover={{
                              scale: 1.1,
                              rotate: 5,
                              borderColor: "rgba(99, 102, 241, 0.6)"
                            }}
                            animate={{
                              boxShadow: ["0 4px 6px rgba(0, 0, 0, 0.1)", "0 8px 15px rgba(0, 0, 0, 0.2)", "0 4px 6px rgba(0, 0, 0, 0.1)"]
                            }}
                            transition={{
                              boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                            }}
                          >
                            <motion.span
                              className={getTaskIconColor(task.type)}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {getTaskIcon(task.type)}
                            </motion.span>
                          </motion.div>
                          <div className="flex-1">
                            <motion.h3
                              className="font-medium text-gray-200 text-lg"
                              whileHover={{ scale: 1.01 }}
                            >
                              {task.title}
                            </motion.h3>
                            <motion.p
                              className="text-sm mt-1 text-gray-400"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              {task.description}
                            </motion.p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-sm">
                          <motion.span
                            className="bg-gray-700 px-3 py-1 rounded-lg text-gray-200 border border-gray-600 font-medium"
                            whileHover={{
                              scale: 1.05,
                              backgroundColor: "rgba(99, 102, 241, 0.2)",
                              borderColor: "rgba(99, 102, 241, 0.4)"
                            }}
                          >
                            {task.duration} minutes
                          </motion.span>
                          <div className="flex items-center">
                            {task.status === 'COMPLETED' ? (
                              <motion.span
                                className="flex items-center text-green-600"
                                whileHover={{ scale: 1.05 }}
                                animate={{
                                  color: ["rgb(22, 163, 74)", "rgb(34, 197, 94)", "rgb(22, 163, 74)"]
                                }}
                                transition={{
                                  color: { duration: 2, repeat: Infinity }
                                }}
                              >
                                <motion.svg
                                  className="h-4 w-4 mr-1"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 1 }}
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </motion.svg>
                                <span>Completed</span>
                              </motion.span>
                            ) : task.status === 'IN_PROGRESS' ? (
                              <span className="flex items-center text-blue-600">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>In Progress</span>
                              </span>
                            ) : task.status === 'SKIPPED' ? (
                              <span className="flex items-center text-gray-600">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Skipped</span>
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-600">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {task.type === 'QUIZ' && task.content && (
                          <div className="mt-4">
                            <motion.button
                              className="text-sm bg-archer-bright-teal text-white font-medium py-2 px-4 rounded-lg shadow-button hover:shadow-card-hover transition-all"
                              onClick={() => { router.push(`/quiz/${task.content._id}?taskId=${task._id}&userId=${user?._id}`); }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              animate={{
                                boxShadow: ["0 4px 6px rgba(20, 184, 166, 0.2)", "0 8px 15px rgba(20, 184, 166, 0.4)", "0 4px 6px rgba(20, 184, 166, 0.2)"]
                              }}
                              transition={{
                                boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                              }}
                            >
                              Start Quiz
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </motion.div>

        {studyPlan && (
        <motion.div
          className="glassmorphic-card rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{
            scale: 1.01,
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(99, 102, 241, 0.2)",
            transition: { duration: 0.4 }
          }}
        >
          <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <motion.h2
              className="text-xl font-semibold text-white flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.svg
                className="w-6 h-6 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{
                  scale: [1, 1.1, 1],
                  color: ["rgba(255, 255, 255, 1)", "rgba(99, 102, 241, 1)", "rgba(255, 255, 255, 1)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </motion.svg>
              Study Plan Summary
            </motion.h2>
          </div>
          <div className="p-6 bg-gradient-to-br from-black/20 to-gray-900/20 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <motion.div
                className="glassmorphic-card rounded-xl p-5"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 0 5px rgba(20, 184, 166, 0.3)",
                  transition: { duration: 0.3 }
                }}
                variants={fadeIn}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3 shadow-button">
                    <svg className="w-6 h-6 text-archer-bright-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-200 text-lg">Plan Details</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Plan Type</span>
                      <span className="font-medium text-gray-200 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-lg shadow-button">
                        {studyPlan.isPersonalized ? 'Personalized' : 'Default'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Created</span>
                      <span className="font-medium text-gray-200">{format(new Date(studyPlan.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last Updated</span>
                      <span className="font-medium text-gray-200">{format(new Date(studyPlan.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              {user && (
                <>
                  <motion.div
                    className="glassmorphic-card rounded-xl p-5"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 0 5px rgba(59, 130, 246, 0.3)",
                      transition: { duration: 0.3 }
                    }}
                    variants={fadeIn}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 shadow-button">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-200 text-lg">Study Schedule</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Available Days</span>
                          <span className="font-medium text-gray-200">{user.preferences?.availableDays?.join(', ') || 'All days'}</span>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Hours Per Day</span>
                          <span className="font-medium text-gray-200">{user.preferences?.studyHoursPerDay || '2'} hours</span>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Preferred Time</span>
                          <span className="font-medium text-gray-200 capitalize">{user.preferences?.preferredStudyTime || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    className="glassmorphic-card rounded-xl p-5"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 0 5px rgba(34, 197, 94, 0.3)",
                      transition: { duration: 0.3 }
                    }}
                    variants={fadeIn}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-3 shadow-button">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-200 text-lg">Progress</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Days Until Exam</span>
                          <span className="font-medium text-gray-200 px-3 py-1 bg-green-500/20 text-green-300 rounded-lg shadow-button">
                            {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Tasks</span>
                          <span className="font-medium text-gray-200">{tasks.length}</span>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg shadow-inner border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Completed Tasks</span>
                          <span className="font-medium text-gray-200">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard" className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-archer-bright-teal to-blue-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                  <motion.svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ x: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </motion.svg>
                  Back to Dashboard
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      <TaskDetailPopover taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onStatusChange={handleTaskStatusChange} />
      {studyPlan && (<TaskCreationModal isOpen={isTaskCreationModalOpen} onClose={() => setIsTaskCreationModalOpen(false)} onSubmit={handleCreateTask} initialDate={taskCreationDate || new Date()} studyPlanId={studyPlan._id} />)}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="glassmorphic-strong rounded-xl max-w-md w-full mx-4 p-6 text-white"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-bold text-white mb-2">Reset Schedule</h3>
            <p className="text-gray-200 mb-4">
              Are you sure you want to reset your schedule to the original plan? This will undo all your manual changes.
            </p>
            <div className="flex justify-end space-x-3">
              <motion.button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all shadow-button"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleResetSchedule}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: ["0 4px 6px rgba(220, 38, 38, 0.2)", "0 8px 15px rgba(220, 38, 38, 0.4)", "0 4px 6px rgba(220, 38, 38, 0.2)"]
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                }}
              >
                Reset Schedule
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </AppLayout>
  );
}
