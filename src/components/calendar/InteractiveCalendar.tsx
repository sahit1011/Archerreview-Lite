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
        /* Token-driven FullCalendar theme — follows Aurora light/dark automatically */
        .interactive-calendar .fc {
          --fc-border-color: var(--border);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: var(--secondary);
          --fc-today-bg-color: color-mix(in srgb, var(--primary) 6%, transparent);
          --fc-event-border-width: 1px;
          font-family: var(--font-sans);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 1rem;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.1);
          color: var(--foreground);
        }

        .interactive-calendar .fc .fc-scrollgrid {
          border: none;
          border-radius: 0 0 1rem 1rem;
          overflow: hidden;
        }

        /* Toolbar */
        .interactive-calendar .fc .fc-toolbar {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .interactive-calendar .fc .fc-toolbar-title {
          color: var(--foreground);
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .interactive-calendar .fc .fc-button {
          background: var(--card);
          border: 1px solid var(--input);
          color: var(--muted-foreground);
          border-radius: 0.625rem;
          padding: 0.4rem 0.85rem;
          font-size: 0.8125rem;
          font-weight: 600;
          text-transform: capitalize;
          box-shadow: none;
          transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .interactive-calendar .fc .fc-button:hover {
          background: var(--secondary);
          color: var(--foreground);
        }

        .interactive-calendar .fc .fc-button:focus,
        .interactive-calendar .fc .fc-button:active {
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 35%, transparent) !important;
        }

        .interactive-calendar .fc .fc-button-primary:not(:disabled).fc-button-active,
        .interactive-calendar .fc .fc-button-primary:not(:disabled):active {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--primary-foreground);
        }

        .interactive-calendar .fc .fc-button:disabled {
          opacity: 0.45;
        }

        .interactive-calendar .fc .fc-button-group {
          gap: 0;
        }

        /* Day headers */
        .interactive-calendar .fc .fc-col-header-cell {
          background: var(--secondary);
          border-color: var(--border);
          font-weight: 600;
          color: var(--muted-foreground);
          padding: 0.65rem 0.25rem;
          text-transform: uppercase;
          font-size: 0.6875rem;
          letter-spacing: 0.08em;
        }

        /* Month grid cells */
        .interactive-calendar .fc-daygrid-day {
          background: transparent;
          border-color: var(--border);
          min-height: 6rem;
          transition: background-color 0.15s ease;
        }

        .interactive-calendar .fc-daygrid-day:hover {
          background: color-mix(in srgb, var(--primary) 4%, transparent);
        }

        .interactive-calendar .fc-daygrid-day-frame {
          padding: 0.25rem !important;
          min-height: 4.5rem;
        }

        .interactive-calendar .fc-daygrid-day-number {
          font-weight: 600;
          color: var(--muted-foreground);
          padding: 0.35rem 0.45rem;
          font-size: 0.8125rem;
        }

        .interactive-calendar .fc-day-other .fc-daygrid-day-number {
          color: color-mix(in srgb, var(--muted-foreground) 45%, transparent);
        }

        .interactive-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: var(--primary);
          color: var(--primary-foreground);
          border-radius: 9999px;
          min-width: 1.75rem;
          height: 1.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0.2rem;
          padding: 0 0.4rem;
          font-weight: 700;
        }

        /* Events — soft tinted chips with readable text */
        .interactive-calendar .fc-event {
          --event-bg: color-mix(in srgb, var(--muted-foreground) 12%, transparent);
          --event-border: color-mix(in srgb, var(--muted-foreground) 25%, transparent);
          --event-text: var(--foreground);
          cursor: pointer;
        }

        .interactive-calendar .fc-event.video-task {
          --event-bg: color-mix(in srgb, var(--color-sky-500, #0ea5e9) 12%, transparent);
          --event-border: color-mix(in srgb, var(--color-sky-500, #0ea5e9) 30%, transparent);
          --event-text: color-mix(in srgb, var(--color-sky-500, #0ea5e9) 85%, var(--foreground));
        }
        .interactive-calendar .fc-event.quiz-task {
          --event-bg: color-mix(in srgb, var(--primary) 13%, transparent);
          --event-border: color-mix(in srgb, var(--primary) 32%, transparent);
          --event-text: color-mix(in srgb, var(--primary) 82%, var(--foreground));
        }
        .interactive-calendar .fc-event.reading-task {
          --event-bg: color-mix(in srgb, var(--color-emerald-500, #10b981) 12%, transparent);
          --event-border: color-mix(in srgb, var(--color-emerald-500, #10b981) 30%, transparent);
          --event-text: color-mix(in srgb, var(--color-emerald-500, #10b981) 85%, var(--foreground));
        }
        .interactive-calendar .fc-event.practice-task {
          --event-bg: color-mix(in srgb, var(--color-amber-500, #f59e0b) 14%, transparent);
          --event-border: color-mix(in srgb, var(--color-amber-500, #f59e0b) 35%, transparent);
          --event-text: color-mix(in srgb, var(--color-amber-500, #f59e0b) 85%, var(--foreground));
        }
        .interactive-calendar .fc-event.review-task {
          --event-bg: color-mix(in srgb, var(--color-rose-500, #f43f5e) 12%, transparent);
          --event-border: color-mix(in srgb, var(--color-rose-500, #f43f5e) 30%, transparent);
          --event-text: color-mix(in srgb, var(--color-rose-500, #f43f5e) 85%, var(--foreground));
        }
        .interactive-calendar .fc-event.missed-task {
          --event-bg: color-mix(in srgb, var(--color-orange-500, #f97316) 14%, transparent);
          --event-border: color-mix(in srgb, var(--color-orange-500, #f97316) 40%, transparent);
          --event-text: color-mix(in srgb, var(--color-orange-500, #f97316) 85%, var(--foreground));
        }

        /* Text blends each hue toward --foreground, so it adapts to light/dark
           automatically — no per-theme hex overrides needed. */

        .interactive-calendar .fc-event,
        .interactive-calendar .fc-event .fc-event-main {
          background-color: var(--event-bg) !important;
          border-color: var(--event-border) !important;
          color: var(--event-text) !important;
        }

        .interactive-calendar .fc-daygrid-event {
          border: 1px solid !important;
          border-radius: 0.4rem !important;
          margin: 0.1rem 0.15rem !important;
          font-size: 0.7rem !important;
          padding: 0.15rem 0.4rem !important;
          font-weight: 600 !important;
          transition: border-color 0.15s ease, opacity 0.15s ease !important;
        }

        .interactive-calendar .fc-daygrid-event:hover {
          border-color: color-mix(in srgb, var(--event-text) 55%, transparent) !important;
          opacity: 0.9;
        }

        .interactive-calendar .fc-daygrid-event .fc-event-main {
          padding: 0 !important;
        }

        .interactive-calendar .fc-daygrid-more-link {
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* Time grid */
        .interactive-calendar .fc-timegrid-slot {
          height: 2.75em !important;
          border-color: var(--border);
        }

        .interactive-calendar .fc-timegrid-slot-label {
          color: var(--muted-foreground);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .interactive-calendar .fc-timegrid-event {
          border-radius: 0.5rem !important;
          border-width: 1px !important;
          border-style: solid !important;
          box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.12) !important;
          padding: 0.35rem 0.5rem !important;
        }

        .interactive-calendar .fc-timegrid-event .fc-event-main,
        .interactive-calendar .fc-timegrid-event .fc-event-title,
        .interactive-calendar .fc-timegrid-event .fc-event-time {
          color: var(--event-text) !important;
          font-weight: 600;
        }

        .interactive-calendar .fc-timegrid-axis,
        .interactive-calendar .fc-timegrid-divider {
          background: var(--secondary) !important;
          border-color: var(--border) !important;
        }

        .interactive-calendar .fc .fc-timegrid-now-indicator-line {
          border-color: var(--destructive);
        }

        /* Selected date */
        .interactive-calendar .fc-day-selected {
          background: color-mix(in srgb, var(--primary) 8%, transparent) !important;
          box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent) !important;
        }

        /* Mobile toolbar: stack + center */
        @media (max-width: 640px) {
          .interactive-calendar .fc .fc-toolbar.fc-header-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .interactive-calendar .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          .interactive-calendar .fc .fc-toolbar-title {
            text-align: center;
            font-size: 1rem;
          }
          .interactive-calendar .fc .fc-button {
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
          }
          /* month cells are too narrow for time labels on phones */
          .interactive-calendar .fc-daygrid-event .event-time {
            display: none;
          }
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
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        views={{
          dayGridMonth: { dayHeaderFormat: { weekday: 'short' }, dayMaxEventRows: 3 },
          timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: 'numeric' } },
          timeGridDay: { dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' } },
        }}
        nowIndicator={true}
        eventMinHeight={20}
        eventContent={(eventInfo) => (
          <div className="relative px-1.5 py-0.5 h-full flex items-center justify-between rounded w-full min-w-0">
            <div className="font-medium text-xs truncate flex-1 mr-1.5">{eventInfo.event.title}</div>
            <div className="event-time text-xs font-medium whitespace-nowrap opacity-80">{eventInfo.timeText}</div>
          </div>
        )}
      />
    </div>
  );
}
