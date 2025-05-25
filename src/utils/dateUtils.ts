/**
 * Date utility functions for the calendar
 */

import { addDays, addMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Get the date range for a calendar view
 * @param date The current date
 * @param view The current view ('timeGridDay', 'timeGridWeek', 'dayGridMonth')
 * @param padding Optional padding days to add to the range (default: 0)
 * @returns Object with start and end dates
 */
export function getDateRangeForView(
  date: Date, 
  view: string, 
  padding: number = 0
): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  switch (view) {
    case 'timeGridDay':
      start = startOfDay(date);
      end = endOfDay(date);
      break;
    case 'timeGridWeek':
      start = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
      end = endOfWeek(date, { weekStartsOn: 0 });
      break;
    case 'dayGridMonth':
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    default:
      // Default to a week view
      start = startOfWeek(date, { weekStartsOn: 0 });
      end = endOfWeek(date, { weekStartsOn: 0 });
  }

  // Add padding if specified
  if (padding > 0) {
    start = addDays(start, -padding);
    end = addDays(end, padding);
  }

  return { start, end };
}

/**
 * Check if a date range has changed significantly enough to warrant a refetch
 * @param prevStart Previous start date
 * @param prevEnd Previous end date
 * @param newStart New start date
 * @param newEnd New end date
 * @returns Boolean indicating if the range has changed significantly
 */
export function hasDateRangeChanged(
  prevStart: Date | null,
  prevEnd: Date | null,
  newStart: Date,
  newEnd: Date
): boolean {
  if (!prevStart || !prevEnd) return true;
  
  // Check if the new range is completely outside the old range
  if (newStart > prevEnd || newEnd < prevStart) {
    return true;
  }
  
  // Check if the new range extends beyond the old range by more than 25%
  const prevRangeDays = (prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24);
  const startDiff = (prevStart.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24);
  const endDiff = (newEnd.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24);
  
  return startDiff > prevRangeDays * 0.25 || endDiff > prevRangeDays * 0.25;
}
