'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import InteractiveCalendar from '@/components/calendar/InteractiveCalendar';
import TaskDetailPopover from '@/components/calendar/TaskDetailPopover';
import TaskCreationModal from '@/components/calendar/TaskCreationModal';
import CalendarFilters, { FilterOptions } from '@/components/calendar/CalendarFilters';
import AlertButton from '@/components/common/AlertButton';
import DuplicateSessionsCleanupButton from '@/components/calendar/DuplicateSessionsCleanupButton';

function CalendarContent() {
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

  const fetchTasks = async () => {
    if (!studyPlan || !user) return;
    try {
      setLoading(true);
      const tasksResponse = await fetch(`/api/tasks?planId=${studyPlan._id}`);
      const tasksData = await tasksResponse.json();
      if (tasksData.success) {
        setTasks(tasksData.tasks || []);
      }
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const selectedDateTasksResponse = await fetch(`/api/tasks?planId=${studyPlan._id}&date=${formattedDate}`);
      const selectedDateTasksData = await selectedDateTasksResponse.json();
      if (selectedDateTasksData.success) {
        setTodaysTasks(selectedDateTasksData.tasks || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading tasks');
      setLoading(false);
    }
  };

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
  }, [studyPlan, user]);

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
    const fetchTasksForDate = async () => {
      try {
        setLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const selectedDateTasksResponse = await fetch(`/api/tasks?planId=${studyPlan._id}&date=${formattedDate}`);
        const selectedDateTasksData = await selectedDateTasksResponse.json();
        if (selectedDateTasksData.success) {
          setTodaysTasks(selectedDateTasksData.tasks || []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks for date:', err);
        setLoading(false);
      }
    };
    fetchTasksForDate();
  }, [selectedDate, studyPlan, user]);

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
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const handleAddTask = (date: Date) => { setTaskCreationDate(date); setIsTaskCreationModalOpen(true); };
  const handleCreateTask = async (taskData: any) => { /* Implementation omitted for brevity */ };
  const handleFilterChange = (newFilters: FilterOptions) => setFilters(newFilters);
  const handleResetSchedule = async () => { /* Implementation omitted for brevity */ };

  if (loading && isInitialLoad) {
    return <AppLayout><div className="flex flex-col items-center justify-center h-64"><div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div><p className="mt-4 text-archer-light-text">Loading your calendar...</p></div></AppLayout>;
  }

  if (error) {
    return <AppLayout><div className="bg-red-900/20 border border-red-900/30 text-red-400 rounded-lg p-4 mb-6"><div className="flex"><svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg><p>{error}</p></div><div className="mt-4"><Link href="/dashboard" className="text-red-400 hover:text-red-300 font-medium">Back to Dashboard →</Link></div></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-archer-white">Study Calendar</h1>
            {user && (<p className="text-archer-light-text/80">Viewing {user.name}'s personalized study schedule</p>)}
          </div>
          <div className="flex items-center space-x-4">
            {user && (<DuplicateSessionsCleanupButton userId={user._id} />)}
            {user && <AlertButton userId={user._id} position="top-right" />}
            {user && user.examDate && (
              <div className="bg-archer-bright-teal/10 rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-archer-bright-teal">Exam Date</div>
                <div className="text-xl font-bold text-archer-white">{format(new Date(user.examDate), 'MMM d, yyyy')}</div>
                <div className="text-sm mt-1 bg-archer-bright-teal/20 text-archer-bright-teal rounded-full px-2 py-0.5 inline-block">
                  {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CalendarFilters onFilterChange={handleFilterChange} initialFilters={filters} topics={topics} topicsLoading={topicsLoading} />
      </div>

      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all overflow-hidden mb-6">
        {loading && !isInitialLoad && (
          <div className="absolute inset-0 bg-card-background-dark/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-t-3 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-archer-bright-teal font-medium">Updating calendar...</p>
            </div>
          </div>
        )}
        <div className="relative">
          <InteractiveCalendar tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} onTaskClick={(taskId) => setSelectedTaskId(taskId)} onDateClick={(date) => setSelectedDate(date)} onAddTask={handleAddTask} selectedDate={selectedDate} initialView={initialView} />
        </div>
        <div className="bg-card-background-dark py-4 px-5 text-sm text-archer-light-text/70">
          <div className="flex flex-col space-y-3">
            {tasks.length === 0 ? (
              <div className="py-2 text-center"><p>No tasks scheduled.</p>{user?.name === "New User" && (<p className="mt-1">This user doesn't have any tasks scheduled yet.</p>)}</div>
            ) : (
              <div className="flex justify-between items-center">
                <p>
                  {filteredTasks.length !== tasks.length ? (
                    <><span className="font-medium text-archer-bright-teal">{filteredTasks.length}</span> of <span className="font-medium text-archer-light-text">{tasks.length}</span> tasks shown<span className="ml-2 text-xs bg-archer-bright-teal text-archer-dark-teal px-2.5 py-1 rounded-full shadow-button">Filtered</span></>
                  ) : (
                    <><span className="font-medium text-archer-bright-teal">{tasks.length}</span> tasks scheduled</>
                  )}
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-archer-light-text/70 italic">Drag and drop to reschedule tasks</p>
                  <button onClick={handleResetSchedule} className="text-sm bg-red-400 hover:bg-red-500 text-archer-dark-teal font-medium py-2 px-4 rounded-lg transition-all flex items-center shadow-button hover:shadow-card-hover transform hover:-translate-y-1">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset Schedule
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-5 justify-center pt-3 bg-archer-dark-teal/50 p-3 rounded-lg mt-2">
              <div className="flex items-center"><div className="w-4 h-4 bg-blue-700/80 rounded-full mr-2 border border-blue-800"></div><span className="text-sm text-archer-light-text">Video</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-archer-dark-teal/90 rounded-full mr-2 border border-archer-bright-teal/80"></div><span className="text-sm text-archer-light-text">Quiz</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-emerald-700/80 rounded-full mr-2 border border-emerald-800"></div><span className="text-sm text-archer-light-text">Reading</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-amber-600/80 rounded-full mr-2 border border-amber-700"></div><span className="text-sm text-archer-light-text">Practice</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-rose-700/80 rounded-full mr-2 border border-rose-800"></div><span className="text-sm text-archer-light-text">Review</span></div>
              <div className="flex items-center"><div className="w-4 h-4 bg-violet-700/80 rounded-full mr-2 border border-violet-800"></div><span className="text-sm text-archer-light-text">Overloaded</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all overflow-hidden mb-6">
        <div className="p-5 border-b border-border-color-dark">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-archer-white">{format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "Today's Schedule" : "Schedule"}</h2>
            <div className="flex items-center space-x-3">
              <button onClick={goToPreviousDay} className="p-2 rounded-full bg-archer-dark-teal hover:bg-archer-dark-teal/70 transition-all shadow-button" aria-label="Previous day"><svg className="w-5 h-5 text-archer-light-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <div className="relative">
                <button onClick={toggleDatePicker} className="flex items-center px-4 py-2 bg-archer-bright-teal text-archer-dark-teal rounded-lg transition-all shadow-button hover:shadow-card-hover">
                  <span className="text-sm font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showDatePicker && (
                  <div className="absolute z-10 mt-2 right-0 bg-card-background-dark rounded-lg shadow-card p-3">
                    <div className="p-2 border-b border-border-color-dark mb-2"><button onClick={goToToday} className="w-full px-4 py-2 text-sm font-medium bg-archer-bright-teal text-archer-dark-teal rounded-lg shadow-button hover:shadow-card-hover transition-all">Today</button></div>
                    <div className="p-2">
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-archer-light-text mb-2"><div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div></div>
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
              <button onClick={goToNextDay} className="p-2 rounded-full bg-archer-dark-teal hover:bg-archer-dark-teal/70 transition-all shadow-button" aria-label="Next day"><svg className="w-5 h-5 text-archer-light-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {todaysTasks.length === 0 ? (
            <div className="text-center py-8 bg-card-background-dark rounded-lg p-6 shadow-button">
              <svg className="mx-auto h-16 w-16 text-archer-light-text/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <h3 className="mt-3 text-lg font-medium text-archer-white">No tasks for {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'today' : 'this day'}</h3>
              <p className="mt-2 text-archer-light-text/70">{user?.name === "New User" ? "You don't have any tasks scheduled yet. Your study plan will be generated soon." : format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "You don't have any tasks scheduled for today." : `You don't have any tasks scheduled for ${format(selectedDate, 'MMMM d, yyyy')}.`}</p>
            </div>
          ) : filteredTodaysTasks.length === 0 ? (
            <div className="text-center py-8 bg-card-background-dark rounded-lg p-6 shadow-button">
              <svg className="mx-auto h-16 w-16 text-archer-light-text/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h3 className="mt-3 text-lg font-medium text-archer-white">No tasks match your filters</h3>
              <p className="mt-2 text-archer-light-text/70">Try adjusting your filter settings to see tasks for this day.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-4">
                {filteredTodaysTasks.map((task) => (
                  <div key={task._id} className="flex">
                    <div className="w-24 flex-shrink-0">
                      <div className="text-sm font-medium bg-archer-dark-teal px-3 py-1 rounded-lg shadow-button text-center text-archer-light-text">
                        {format(new Date(task.startTime), 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex-grow pl-4">
                      <div className="bg-card-background-dark p-4 rounded-lg shadow-card hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                        <div className="flex items-start">
                          <div className="h-12 w-12 rounded-full bg-card-background-lighter flex items-center justify-center mr-3 shadow-card">
                            <span className={getTaskIconColor(task.type)}>
                              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                {task.type === 'VIDEO' && (
                                  <><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></>
                                )}
                                {task.type === 'QUIZ' && (
                                  <><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></>
                                )}
                                {task.type === 'READING' && (
                                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                )}
                                {task.type === 'PRACTICE' && (
                                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                                )}
                                {task.type === 'REVIEW' && (
                                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                                )}
                                {!['VIDEO', 'QUIZ', 'READING', 'PRACTICE', 'REVIEW'].includes(task.type) && (
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                )}
                              </svg>
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-archer-white text-lg">{task.title}</h3>
                            <p className="text-sm mt-1 text-archer-light-text/70">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 text-sm">
                          <span className="bg-archer-dark-teal/50 px-3 py-1 rounded-lg text-archer-light-text">{task.duration} minutes</span>
                          <div className="flex items-center">
                            {task.status === 'COMPLETED' ? (
                              <span className="flex items-center text-green-500">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Completed</span>
                              </span>
                            ) : task.status === 'IN_PROGRESS' ? (
                              <span className="flex items-center text-blue-500">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>In Progress</span>
                              </span>
                            ) : task.status === 'SKIPPED' ? (
                              <span className="flex items-center text-gray-500">
                                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Skipped</span>
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-500">
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
                            <button className="text-sm bg-archer-dark-teal text-archer-light-text font-medium py-2 px-4 rounded-lg shadow-button hover:shadow-card-hover transition-all transform hover:-translate-y-1" onClick={() => { router.push(`/quiz/${task.content._id}?taskId=${task._id}&userId=${user?._id}`); }}>
                              Start Quiz
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

      {studyPlan && (
        <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all overflow-hidden">
          <div className="p-5 border-b border-border-color-dark"><h2 className="text-xl font-semibold text-archer-white">Study Plan Summary</h2></div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-card-background-dark rounded-xl p-5 shadow-card">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-archer-bright-teal/20 flex items-center justify-center mr-3 shadow-button">
                    <svg className="w-6 h-6 text-archer-bright-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-archer-white text-lg">Plan Details</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-archer-light-text/80">Plan Type</span>
                      <span className="font-medium text-archer-white px-3 py-1 bg-archer-bright-teal text-archer-dark-teal rounded-lg shadow-button">
                        {studyPlan.isPersonalized ? 'Personalized' : 'Default'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-archer-light-text/80">Created</span>
                      <span className="font-medium text-archer-light-text">{format(new Date(studyPlan.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-archer-light-text/80">Last Updated</span>
                      <span className="font-medium text-archer-light-text">{format(new Date(studyPlan.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
              {user && (
                <>
                  <div className="bg-card-background-dark rounded-xl p-5 shadow-card">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-archer-light-blue/20 flex items-center justify-center mr-3 shadow-button">
                        <svg className="w-6 h-6 text-archer-light-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-archer-white text-lg">Study Schedule</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Available Days</span>
                          <span className="font-medium text-archer-light-text">{user.preferences?.availableDays?.join(', ') || 'All days'}</span>
                        </div>
                      </div>
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Hours Per Day</span>
                          <span className="font-medium text-archer-light-text">{user.preferences?.studyHoursPerDay || '2'} hours</span>
                        </div>
                      </div>
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Preferred Time</span>
                          <span className="font-medium text-archer-light-text capitalize">{user.preferences?.preferredStudyTime || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card-background-dark rounded-xl p-5 shadow-card">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center mr-3 shadow-button">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-archer-white text-lg">Progress</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Days Until Exam</span>
                          <span className="font-medium text-archer-white px-3 py-1 bg-archer-bright-teal text-archer-dark-teal rounded-lg shadow-button">
                            {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Total Tasks</span>
                          <span className="font-medium text-archer-light-text">{tasks.length}</span>
                        </div>
                      </div>
                      <div className="bg-archer-dark-teal/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-archer-light-text/80">Completed Tasks</span>
                          <span className="font-medium text-archer-light-text">{tasks.filter(t => t.status === 'COMPLETED').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-center">
              <Link href="/dashboard" className="inline-flex items-center px-5 py-3 bg-archer-bright-teal text-archer-dark-teal rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all transform hover:-translate-y-1">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <TaskDetailPopover taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onStatusChange={handleTaskStatusChange} />
      {studyPlan && (<TaskCreationModal isOpen={isTaskCreationModalOpen} onClose={() => setIsTaskCreationModalOpen(false)} onSubmit={handleCreateTask} initialDate={taskCreationDate || new Date()} studyPlanId={studyPlan._id} />)}
    </AppLayout>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-archer-light-text">Loading your calendar...</p>
        </div>
      </AppLayout>
    }>
      <CalendarContent />
    </Suspense>
  );
}