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

    const mappedEvents = tasks.map((task) => {
      // Check if task is missed (past due and not completed)
      const isMissed = task.status === 'PENDING' && new Date(task.endTime) < new Date();

      // Create CSS class based on task type
      let className = '';
      let backgroundColor = '';
      let borderColor = '';

      if (isMissed) {
        className = 'missed-task';
        backgroundColor = '#374151'; // gray-700
        borderColor = '#EF4444'; // red-500
      } else {
        switch (task.type) {
          case 'VIDEO':
            className = 'video-task';
            backgroundColor = 'rgba(29, 78, 216, 0.8)'; // blue-700/80
            borderColor = '#1e40af'; // blue-800
            break;
          case 'QUIZ':
            className = 'quiz-task';
            backgroundColor = 'rgba(0, 48, 73, 0.9)'; // archer-dark-teal/90
            borderColor = 'rgba(0, 169, 157, 0.8)'; // archer-bright-teal/80
            break;
          case 'READING':
            className = 'reading-task';
            backgroundColor = 'rgba(4, 120, 87, 0.8)'; // emerald-700/80
            borderColor = '#065f46'; // emerald-800
            break;
          case 'PRACTICE':
            className = 'practice-task';
            backgroundColor = 'rgba(217, 119, 6, 0.8)'; // amber-600/80
            borderColor = '#b45309'; // amber-700
            break;
          case 'REVIEW':
            className = 'review-task';
            backgroundColor = 'rgba(190, 18, 60, 0.8)'; // rose-700/80
            borderColor = '#9f1239'; // rose-800
            break;
          case 'OVERLOADED':
            className = 'overloaded-task';
            backgroundColor = 'rgba(109, 40, 217, 0.8)'; // violet-700/80
            borderColor = '#5b21b6'; // violet-800
            break;
          default:
            className = 'default-task';
            backgroundColor = 'rgba(30, 58, 138, 0.9)'; // archer-dark-blue/90
            borderColor = '#1e3a8a'; // archer-dark-blue
        }
      }

      return {
        id: task._id,
        title: task.title,
        start: new Date(task.startTime).toISOString(),
        end: new Date(task.endTime).toISOString(),
        className: className,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: '#FFFFFF', // white text for all
        display: 'block',
        extendedProps: {
          taskId: task._id,
          type: task.type,
          status: task.status,
          description: task.description,
          duration: task.duration,
          topic: task.topic,
          isMissed // Add flag for missed tasks
        }
      };
    });

    setEvents(mappedEvents);
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
    let dayElement = document.querySelector(`.fc-day[data-date="${formattedDate}"]`);

    // If not found, try alternative selectors for different FullCalendar views
    if (!dayElement) {
      dayElement = document.querySelector(`.fc-daygrid-day[data-date="${formattedDate}"]`);
    }

    if (!dayElement) {
      dayElement = document.querySelector(`.fc-col-header-cell[data-date="${formattedDate}"]`);
    }

    // If we found a matching element, add the selected class
    if (dayElement) {
      dayElement.classList.add('fc-day-selected');
      console.log(`Applied selected styling to date: ${formattedDate}`);
    } else {
      console.log(`Could not find element for date: ${formattedDate}`);
    }
  };

  // Note: We've moved the color definitions directly into the event object creation
  // in the useEffect hook above, so these helper functions are no longer needed.

  return (
    <div className="interactive-calendar bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all border border-border-color-light p-1">
      <style jsx global>{`
        /* Increase the height of time slots for better visibility of short tasks */
        .fc-timegrid-slot {
          height: 3em !important;
        }

        /* Modern styling for the calendar - KEEPING THESE as they are structural/layout */
        .fc {
          /* --fc-border-color: rgba(226, 232, 240, 0.8); /* Let globals.css handle this */
          /* --fc-page-bg-color: #fff; /* Let globals.css handle this */
          /* --fc-neutral-bg-color: #f8fafc; /* Let globals.css handle this */
          --fc-event-border-width: 1px; /* Allow borders to be visible */
          font-family: var(--font-geist-sans); /* This is fine */
        }

        .fc .fc-scrollgrid {
          border-radius: 0.5rem;
          overflow: hidden;
          border: none; /* Let globals.css handle border if needed via --fc-border-color */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* This is fine */
        }

        /* REMOVED specific .fc-toolbar, .fc-toolbar-title, button styles as they are in globals.css */

        /* Day headers - these should now be themed by globals.css or inherit */
        /* .fc .fc-col-header-cell { ... } */
        /* .fc .fc-col-header-cell-cushion { ... } */

        /* Time slots - these should now be themed by globals.css or inherit */
        /* .fc .fc-timegrid-slot-label { ... } */

        /* Current time indicator - let globals.css or FC defaults handle this for now */
        /* .fc .fc-timegrid-now-indicator-line { ... } */
        /* .fc .fc-timegrid-now-indicator-arrow { ... } */

        /* Event styling - eventContent function now handles this with Tailwind classes */
        /* .fc-event { ... } */
        /* .fc-event:hover { ... } */
        /* .fc-event .fc-event-main { ... } */

        .fc-timegrid-event { /* Minimum height for events */
          min-height: 2.5em !important;
        }

        .fc-daygrid-day { /* Month view day height */
          min-height: 6rem !important;
        }

        /* .fc-daygrid-day-number { ... } /* Let globals.css handle */

        /* .fc-daygrid-day.fc-day-today { ... } /* Let globals.css handle */
        /* .fc-daygrid-day.fc-day-today .fc-daygrid-day-number { ... } /* Let globals.css handle */

        .fc-daygrid-day-frame { /* Calendar days styling */
          padding: 0.5rem !important;
        }

        .fc-daygrid-day-events {
          margin-top: 0.25rem !important;
        }

        /* .fc-daygrid-event { ... } /* eventContent handles this */
        /* .fc-daygrid-event .fc-event-main { ... } */
        /* .fc-daygrid-event .fc-event-title { ... } */

        /* Selected date styling */
        .fc-day-selected {
          background-color: var(--primary-accent-light, rgba(0, 169, 157, 0.1)) !important;
          border: 2px solid var(--primary-accent) !important;
        }
        .fc-day-selected .fc-daygrid-day-number {
          background-color: var(--primary-accent) !important;
          color: var(--archer-white) !important;
          border-radius: 50% !important;
          padding: 0.25em 0.4em !important;
          display: inline-block !important;
          min-width: 1.5em;
          text-align: center;
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
          right: 'addTaskButton timeGridDay,timeGridWeek,dayGridMonth'
        }}
        customButtons={{
          today: {
            text: 'Today',
            click: () => {
              const calendarApi = calendarRef.current?.getApi();
              calendarApi?.today();
            }
          },
          addTaskButton: {
            text: '+ Add Task',
            click: () => {
              if (onAddTask) {
                // Use the currently selected date or current date
                const calendarApi = calendarRef.current?.getApi();
                const currentDate = calendarApi?.getDate() || new Date();

                // Set time to current time rounded to nearest half hour
                const now = new Date();
                const minutes = now.getMinutes();
                const roundedMinutes = minutes < 30 ? 30 : 0;
                const hours = minutes < 30 ? now.getHours() : now.getHours() + 1;

                currentDate.setHours(hours, roundedMinutes, 0, 0);

                onAddTask(currentDate);
              }
            }
          }
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
        eventMinHeight={30}
        eventContent={(eventInfo) => {
          const { type, isMissed, duration } = eventInfo.event.extendedProps;
          const isMonthView = currentView === 'dayGridMonth';

          if (isMonthView) {
            return (
              <div className="relative text-xs p-1 rounded truncate w-full h-full text-white">
                {isMissed && <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white" />}
                {eventInfo.timeText} {eventInfo.event.title}
              </div>
            );
          }

          return (
            <div className="relative p-2 h-full flex flex-col justify-between rounded-lg w-full text-white">
              {isMissed && <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white" />}
              <div className="font-medium text-sm truncate">{eventInfo.event.title}</div>
              <div className="flex justify-between items-center mt-1 text-xs">
                <span>{eventInfo.timeText} • {duration}min</span>
                <span className={`px-2 py-0.5 rounded capitalize ${isMissed ? 'bg-red-100 text-red-700' : 'bg-black/20'}`}>
                  {isMissed ? 'Missed' : type.toLowerCase()}
                </span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
