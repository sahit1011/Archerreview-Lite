'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';

// Define types for our component props
interface InteractiveCalendarProps {
  tasks: any[];
  onTaskUpdate?: (taskId: string, startTime: Date, endTime: Date) => Promise<void>;
  onTaskClick?: (taskId: string) => void;
  onDateClick?: (date: Date) => void;
  onAddTask?: (date: Date) => void;
  selectedDate?: Date;
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
}

// Define types for FullCalendar events
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  className?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    taskId: string;
    type: string;
    status: string;
    description: string;
    duration: number;
    topic: any;
    isMissed?: boolean;
  };
}

export default function InteractiveCalendar({
  tasks,
  onTaskUpdate,
  onTaskClick,
  onDateClick,
  onAddTask,
  selectedDate = new Date(),
  initialView = 'timeGridDay'
}: InteractiveCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<string>(initialView);
  const calendarRef = useRef<any>(null);

  // Apply selected date styling when selectedDate or currentView changes
  useEffect(() => {
    // Wait a bit for the calendar to render
    const timer = setTimeout(() => {
      applySelectedDateStyling();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedDate, currentView]);

  // Convert tasks to calendar events
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    console.log(`[InteractiveCalendar] Task processing triggered. received ${tasks.length} tasks.`);

    const eventMap = new Map<string, CalendarEvent>();

    tasks.forEach((task) => {
      // Check if task is missed (past due and not completed)
      const isMissed = task.status === 'PENDING' && new Date(task.endTime) < new Date();

      // Create CSS class based on task type
      let className = '';
      if (isMissed) {
        className = 'missed-task';
      } else {
        switch (task.type) {
          case 'VIDEO':
            className = 'video-task';
            break;
          case 'QUIZ':
            className = 'quiz-task';
            break;
          case 'READING':
            className = 'reading-task';
            break;
          case 'PRACTICE':
            className = 'practice-task';
            break;
          case 'REVIEW':
            className = 'review-task';
            break;
          case 'OVERLOADED':
            className = 'overloaded-task';
            break;
          default:
            className = 'default-task';
        }
      }

      const event: CalendarEvent = {
        id: task._id,
        title: task.title,
        start: new Date(task.startTime).toISOString(),
        end: new Date(task.endTime).toISOString(),
        className: className,
        extendedProps: {
          taskId: task._id,
          type: task.type,
          status: task.status,
          description: task.description,
          duration: task.duration,
          topic: task.topic,
          isMissed
        }
      };
      eventMap.set(task._id, event);
    });

    setEvents(Array.from(eventMap.values()));
  }, [tasks]);

  // Handle event drop (drag and drop)
  const handleEventDrop = async (info: any) => {
    if (!onTaskUpdate) return;

    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end || new Date(newStart.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time

    try {
      await onTaskUpdate(taskId, newStart, newEnd);
    } catch (error) {
      console.error('Error updating task:', error);
      info.revert(); // Revert the drag if there's an error
    }
  };

  // Handle event resize
  const handleEventResize = async (info: any) => {
    if (!onTaskUpdate) return;

    const taskId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    try {
      await onTaskUpdate(taskId, newStart, newEnd);
    } catch (error) {
      console.error('Error updating task:', error);
      info.revert(); // Revert the resize if there's an error
    }
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    if (!onTaskClick) return;
    onTaskClick(info.event.id);
  };

  // Handle view change
  const handleViewChange = (info: any) => {
    setCurrentView(info.view.type);

    // Apply selected date styling after view changes
    applySelectedDateStyling();
  };

  // Handle date click
  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(info.date);
    }

    // If we're in day or week view, clicking on a time slot should open the add task modal
    if (onAddTask && (currentView === 'timeGridDay' || currentView === 'timeGridWeek')) {
      onAddTask(info.date);
    }
  };

  // Apply styling to the selected date
  const applySelectedDateStyling = () => {
    if (!calendarRef.current) return;

    // Remove previous selected date styling
    document.querySelectorAll('.fc-day-selected').forEach(el => {
      el.classList.remove('fc-day-selected');
    });

    // Format the selected date to match FullCalendar's date attribute format
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    // Find the day element with the matching date attribute
    // Try different selectors based on the current view
    const selectors = [
      `.fc-day[data-date="${formattedDate}"]`,
      `.fc-daygrid-day[data-date="${formattedDate}"]`,
      `.fc-col-header-cell[data-date="${formattedDate}"]`,
      `.fc-timegrid-day[data-date="${formattedDate}"]`,
      `.fc-timegrid-col[data-date="${formattedDate}"]`,
      `[data-date="${formattedDate}"]`
    ];

    // Try each selector until we find a matching element
    let dayElement = null;
    for (const selector of selectors) {
      dayElement = document.querySelector(selector);
      if (dayElement) break;
    }

    // If we found a matching element, add the selected class
    if (dayElement) {
      dayElement.classList.add('fc-day-selected');
      console.log(`Applied selected styling to date: ${formattedDate}`);
    } else {
      console.log(`Could not find element for date: ${formattedDate}. Will try again after a delay.`);
      
      // Try again after a longer delay to ensure the calendar has fully rendered
      setTimeout(() => {
        for (const selector of selectors) {
          dayElement = document.querySelector(selector);
          if (dayElement) {
            dayElement.classList.add('fc-day-selected');
            console.log(`Applied selected styling to date after delay: ${formattedDate}`);
            break;
          }
        }
      }, 500);
    }
  };

  // Note: We've moved the color definitions directly into the event object creation
  // in the useEffect hook above, so these helper functions are no longer needed.

  return (
    <div className="interactive-calendar">
      <style jsx global>{`
        /* Glassmorphic FullCalendar styling */
        .interactive-calendar .fc {
          --fc-border-color: rgba(255, 255, 255, 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
          --fc-event-border-width: 1px;
          font-family: var(--font-geist-sans);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .interactive-calendar .fc .fc-scrollgrid {
          border: none;
          border-radius: 1rem;
          overflow: hidden;
          background: transparent;
        }

        .interactive-calendar .fc .fc-toolbar {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem 1rem 0 0;
        }

        .interactive-calendar .fc .fc-toolbar-title {
          color: rgba(255, 255, 255, 0.95);
          font-size: 1.5rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .interactive-calendar .fc .fc-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 0.75rem;
          padding: 0.75rem 1.25rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .interactive-calendar .fc .fc-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .interactive-calendar .fc .fc-button-active {
          background: rgba(99, 102, 241, 0.3);
          border-color: rgba(99, 102, 241, 0.5);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        /* Day headers */
        .interactive-calendar .fc .fc-col-header-cell {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-color: rgba(255, 255, 255, 0.1);
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          padding: 1rem 0.5rem;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Calendar days - Compact */
        .interactive-calendar .fc-daygrid-day {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(5px);
          border-color: rgba(255, 255, 255, 0.08);
          min-height: 6rem !important;
          position: relative;
          transition: all 0.3s ease;
        }

        .interactive-calendar .fc-daygrid-day:hover {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .interactive-calendar .fc-daygrid-day-frame {
          padding: 0.5rem !important;
          min-height: 4rem;
        }

        .interactive-calendar .fc-daygrid-day-number {
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          padding: 0.5rem;
          font-size: 0.875rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .interactive-calendar .fc-daygrid-day.fc-day-today {
          background: rgba(99, 102, 241, 0.15);
          backdrop-filter: blur(20px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
        }

        .interactive-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          color: white;
          border-radius: 50%;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          backdrop-filter: blur(10px);
        }

        /* Glassmorphic Events - Compact */
        .interactive-calendar .fc-daygrid-event {
          border: 1px solid !important;
          border-radius: 0.375rem !important;
          margin: 0.125rem 0 !important;
          font-size: 0.7rem !important;
          padding: 0.25rem 0.5rem !important;
          font-weight: 600 !important;
          backdrop-filter: blur(10px) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          opacity: 0.95 !important;
          transition: all 0.3s ease !important;
          height: 1.5rem !important;
          min-height: 1.5rem !important;
        }

        .interactive-calendar .fc-daygrid-event:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
          opacity: 1 !important;
        }

        .interactive-calendar .fc-daygrid-event .fc-event-main {
          padding: 0 !important;
        }

        .interactive-calendar .fc-daygrid-event .fc-event-title {
          font-weight: 600 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        /* Glassmorphic task colors */
        .interactive-calendar .fc-event {
            --event-bg-color: rgba(255, 255, 255, 0.1);
            --event-border-color: rgba(255, 255, 255, 0.2);
            --event-text-color: rgba(255, 255, 255, 0.9);
        }

        .interactive-calendar .fc-event.video-task {
            --event-bg-color: rgba(59, 130, 246, 0.25);
            --event-border-color: rgba(59, 130, 246, 0.4);
            --event-text-color: rgba(147, 197, 253, 1);
        }

        .interactive-calendar .fc-event.quiz-task {
            --event-bg-color: rgba(20, 184, 166, 0.25);
            --event-border-color: rgba(20, 184, 166, 0.4);
            --event-text-color: rgba(94, 234, 212, 1);
        }
        
        .interactive-calendar .fc-event.reading-task {
            --event-bg-color: rgba(34, 197, 94, 0.25);
            --event-border-color: rgba(34, 197, 94, 0.4);
            --event-text-color: rgba(134, 239, 172, 1);
        }

        .interactive-calendar .fc-event.practice-task {
            --event-bg-color: rgba(245, 158, 11, 0.25);
            --event-border-color: rgba(245, 158, 11, 0.4);
            --event-text-color: rgba(253, 224, 71, 1);
        }

        .interactive-calendar .fc-event.review-task {
            --event-bg-color: rgba(236, 72, 153, 0.25);
            --event-border-color: rgba(236, 72, 153, 0.4);
            --event-text-color: rgba(244, 114, 182, 1);
        }

        .interactive-calendar .fc-event.missed-task {
            --event-bg-color: rgba(239, 68, 68, 0.25);
            --event-border-color: rgba(239, 68, 68, 0.4);
            --event-text-color: rgba(248, 113, 113, 1);
        }

        .interactive-calendar .fc-event,
        .interactive-calendar .fc-event-main {
            background-color: var(--event-bg-color) !important;
            border-color: var(--event-border-color) !important;
            color: var(--event-text-color) !important;
        }

        /* Glassmorphic Time grid styling */
        .interactive-calendar .fc-timegrid-slot {
          height: 3em !important;
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }

        .interactive-calendar .fc-timegrid-slot-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .interactive-calendar .fc-timegrid-event {
          border-radius: 0.75rem !important;
          border-width: 1px !important;
          border-style: solid !important;
          backdrop-filter: blur(15px) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          padding: 0.5rem 0.75rem !important;
          opacity: 0.95 !important;
          transition: all 0.3s ease !important;
        }

        .interactive-calendar .fc-timegrid-event:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
          opacity: 1 !important;
        }

        .interactive-calendar .fc-timegrid-event .fc-event-main,
        .interactive-calendar .fc-timegrid-event .fc-event-title,
        .interactive-calendar .fc-timegrid-event .fc-event-time {
          color: var(--event-text-color) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        .interactive-calendar .fc-timegrid-event .fc-event-main {
          font-weight: 600 !important;
        }

        /* Glassmorphic Selected date styling */
        .interactive-calendar .fc-day-selected {
          background: rgba(99, 102, 241, 0.2) !important;
          backdrop-filter: blur(20px) !important;
          border: 2px solid rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.3) !important;
        }

        .interactive-calendar .fc-day-selected .fc-daygrid-day-number {
          background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
          color: white !important;
          border-radius: 50% !important;
          width: 2.5rem !important;
          height: 2.5rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4) !important;
          backdrop-filter: blur(10px) !important;
        }

        /* Additional glassmorphic effects */
        .interactive-calendar .fc-scrollgrid-section-header > * {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(10px) !important;
        }

        .interactive-calendar .fc-scrollgrid-section-body {
          background: rgba(255, 255, 255, 0.02) !important;
        }

        .interactive-calendar .fc-timegrid-axis {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(10px) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .interactive-calendar .fc-timegrid-divider {
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .interactive-calendar .fc-scrollgrid-sync-table {
          background: transparent !important;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={!!onTaskUpdate}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        viewDidMount={handleViewChange}
        height="auto"
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        dayHeaderFormat={{
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        }}
        nowIndicator={true}
        eventMinHeight={20}
        eventContent={(eventInfo) => (
          <div className="relative px-2 py-1 h-full flex items-center justify-between rounded w-full">
            <div className="font-medium text-xs truncate flex-1 mr-2">{eventInfo.event.title}</div>
            <div className="text-xs font-medium whitespace-nowrap opacity-80">{eventInfo.timeText}</div>
          </div>
        )}
      />
    </div>
  );
}
