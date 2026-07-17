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
import { Reveal } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  CalendarRange,
  Settings2,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  XCircle,
  CircleDot,
  Video,
  FileQuestion,
  BookOpen,
  PenLine,
  LayoutGrid,
} from 'lucide-react';

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
        return 'text-sky-600 dark:text-sky-400';
      case 'QUIZ':
        return 'text-primary';
      case 'READING':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'PRACTICE':
        return 'text-amber-600 dark:text-amber-400';
      case 'REVIEW':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-muted-foreground';
    }
  };

  // Tinted background tile for the task type icon
  const getTaskIconBg = (type: string): string => {
    switch (type) {
      case 'VIDEO':
        return 'bg-sky-500/12';
      case 'QUIZ':
        return 'bg-primary/12';
      case 'READING':
        return 'bg-emerald-500/12';
      case 'PRACTICE':
        return 'bg-amber-500/12';
      case 'REVIEW':
        return 'bg-rose-500/12';
      default:
        return 'bg-muted';
    }
  };

  // Lucide icon per task type for the schedule list
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-5 w-5" />;
      case 'QUIZ': return <FileQuestion className="h-5 w-5" />;
      case 'READING': return <BookOpen className="h-5 w-5" />;
      case 'PRACTICE': return <PenLine className="h-5 w-5" />;
      case 'REVIEW': return <LayoutGrid className="h-5 w-5" />;
      default: return <CircleDot className="h-5 w-5" />;
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
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-14 h-14 border-[3px] border-muted border-t-primary border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading your calendar...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="relative z-0 text-foreground">
        <Reveal className="relative z-10 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Calendar</h1>
              <p className="mt-1.5 text-muted-foreground">Your personalized study schedule — drag tasks to reschedule.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {user && <AlertButton userId={user._id} position="top-right" />}
              {user && user.examDate && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card py-2 pl-3 pr-4 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Exam · {format(new Date(user.examDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal className="mb-6" delay={0.05}>
          <CalendarFilters onFilterChange={handleFilterChange} initialFilters={filters} topics={topics} topicsLoading={topicsLoading} />
        </Reveal>

        <Reveal className="mb-6" delay={0.1}>
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
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col space-y-4">
              {/* Task Count and Reset Button Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {filteredTasks.length !== tasks.length ? (
                    <>
                      <span>
                        <span className="font-semibold text-primary">{filteredTasks.length}</span> of{' '}
                        <span className="font-semibold text-foreground">{tasks.length}</span> tasks shown
                      </span>
                      <Badge variant="default">Filtered</Badge>
                    </>
                  ) : (
                    <span><span className="font-semibold text-primary">{tasks.length}</span> tasks scheduled</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <p className="hidden text-sm italic text-muted-foreground sm:block">Drag and drop to reschedule tasks</p>
                  <button
                    onClick={() => setResetConfirmOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive shadow-sm transition-all hover:bg-destructive/15 hover:-translate-y-0.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Schedule
                  </button>
                </div>
              </div>

              {/* Centered Color Legend */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
                {[
                  { label: 'Video', cls: 'bg-sky-500/70 border-sky-500/40', text: 'text-sky-700 dark:text-sky-400' },
                  { label: 'Quiz', cls: 'bg-primary/70 border-primary/40', text: 'text-primary' },
                  { label: 'Reading', cls: 'bg-emerald-500/70 border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-400' },
                  { label: 'Practice', cls: 'bg-amber-500/70 border-amber-500/40', text: 'text-amber-700 dark:text-amber-400' },
                  { label: 'Review', cls: 'bg-rose-500/70 border-rose-500/40', text: 'text-rose-700 dark:text-rose-400' },
                  { label: 'Missed', cls: 'bg-orange-500/70 border-orange-500/40', text: 'text-orange-700 dark:text-orange-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm border ${item.cls}`}></div>
                    <span className={`font-medium ${item.text}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="mb-6" delay={0.15}>
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Clock className="h-5 w-5" />
              </span>
              {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "Today's Schedule" : "Schedule"}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={goToPreviousDay} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Previous day"><ChevronLeft className="h-5 w-5" /></button>
              <div className="relative">
                <button onClick={toggleDatePicker} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90">
                  <CalendarDays className="h-4 w-4" />
                  <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showDatePicker && (
                  <div className="absolute z-20 mt-2 right-0 rounded-xl border border-border bg-popover shadow-xl p-3">
                    <div className="pb-2 border-b border-border mb-2"><button onClick={goToToday} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">Today</button></div>
                    <div className="p-1">
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }, (_, i) => {
                          const d = new Date(selectedDate); d.setDate(1); const firstDay = d.getDay(); d.setDate(i - firstDay + 1);
                          const isCurrentMonth = d.getMonth() === selectedDate.getMonth();
                          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                          return (<button key={i} onClick={() => handleDateSelect(new Date(d))} className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-colors ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'} ${isToday && !isSelected ? 'bg-primary/15 text-primary' : ''} ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''} ${!isSelected && !isToday ? 'hover:bg-accent' : ''}`}>{d.getDate()}</button>);
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={goToNextDay} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Next day"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {todaysTasks.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-border bg-secondary/40 p-6">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary/70">
                <CalendarDays className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No tasks for {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'today' : 'this day'}</h3>
              <p className="mt-2 text-muted-foreground">{user?.name === "New User" ? "You don't have any tasks scheduled yet. Your study plan will be generated soon." : format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "You don't have any tasks scheduled for today." : `You don't have any tasks scheduled for ${format(selectedDate, 'MMMM d, yyyy')}.`}</p>
            </div>
          ) : filteredTodaysTasks.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-border bg-secondary/40 p-6">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary/70">
                <Settings2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No tasks match your filters</h3>
              <p className="mt-2 text-muted-foreground">Try adjusting your filter settings to see tasks for this day.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-3">
                {filteredTodaysTasks.map((task) => (
                  <div key={task._id} className="flex">
                    <div className="w-20 flex-shrink-0 sm:w-24">
                      <div className="rounded-lg border border-border bg-secondary/50 px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground sm:text-sm">
                        {format(new Date(task.startTime), 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex-grow pl-4">
                      <div className="card-hover rounded-xl border border-border bg-secondary/40 p-4 shadow-sm transition-colors hover:border-primary/30">
                        <div className="flex items-start">
                          <div className={`mr-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${getTaskIconBg(task.type)} ${getTaskIconColor(task.type)}`}>
                            {getTaskTypeIcon(task.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {task.duration} min
                          </span>
                          <div className="flex items-center">
                            {task.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1.5 text-success font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Completed</span>
                              </span>
                            ) : task.status === 'IN_PROGRESS' ? (
                              <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                                <PlayCircle className="h-4 w-4" />
                                <span>In Progress</span>
                              </span>
                            ) : task.status === 'SKIPPED' ? (
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                                <XCircle className="h-4 w-4" />
                                <span>Skipped</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-warning font-medium">
                                <CircleDot className="h-4 w-4" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {(task.content?._id || task.content) && task.status !== 'COMPLETED' && (
                          <div className="mt-4">
                            <button
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
                              onClick={() => { router.push(`/quiz/${task.content?._id || task.content}?taskId=${task._id}&userId=${user?._id}`); }}
                            >
                              <PlayCircle className="h-4 w-4" />
                              {task.type === 'VIDEO' ? 'Watch' : task.type === 'READING' ? 'Read' : 'Start'}
                            </button>
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
        </div>
        </Reveal>

        {studyPlan && (
        <Reveal delay={0.2}>
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              Study Plan Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="card-hover rounded-2xl border border-border bg-secondary/40 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Plan Details</h3>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <span className="text-muted-foreground">Plan Type</span>
                    <Badge variant="default">{studyPlan.isPersonalized ? 'Personalized' : 'Default'}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium text-foreground">{format(new Date(studyPlan.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-foreground">{format(new Date(studyPlan.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
              {user && (
                <>
                  <div className="card-hover rounded-2xl border border-border bg-secondary/40 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
                        <CalendarRange className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Study Schedule</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Available Days</span>
                        <span className="font-medium text-foreground">{user.preferences?.availableDays?.join(', ') || 'All days'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Hours Per Day</span>
                        <span className="font-medium text-foreground">{user.preferences?.studyHoursPerDay || '2'} hours</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Preferred Time</span>
                        <span className="font-medium text-foreground capitalize">{user.preferences?.preferredStudyTime || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-hover rounded-2xl border border-border bg-secondary/40 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Progress</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Days Until Exam</span>
                        <Badge variant="success">
                          {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Total Tasks</span>
                        <span className="font-medium text-foreground">{tasks.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                        <span className="text-muted-foreground">Completed Tasks</span>
                        <span className="font-medium text-foreground">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-center">
              <Link href="/dashboard" className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5">
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
        </Reveal>
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
            className="rounded-2xl border border-border bg-popover shadow-2xl max-w-md w-full mx-4 p-6 text-foreground"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Reset Schedule</h3>
            </div>
            <p className="text-muted-foreground mb-5">
              Are you sure you want to reset your schedule to the original plan? This will undo all your manual changes.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSchedule}
                className="rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/25"
              >
                Reset Schedule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </AppLayout>
  );
}
