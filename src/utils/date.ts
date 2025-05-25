import { format, formatDistance, addDays, differenceInDays, isToday, isSameDay, parseISO } from 'date-fns';

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param formatStr The format string (default: 'PPP')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, formatStr = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format a date to a relative string (e.g., "2 days ago")
 * @param date The date to format
 * @returns Relative date string
 */
export const formatRelative = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Calculate days until exam
 * @param examDate The exam date
 * @returns Number of days until exam
 */
export const daysUntilExam = (examDate: Date | string): number => {
  const dateObj = typeof examDate === 'string' ? parseISO(examDate) : examDate;
  return differenceInDays(dateObj, new Date());
};

/**
 * Check if a date is today
 * @param date The date to check
 * @returns Boolean indicating if the date is today
 */
export const checkIfToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
};

/**
 * Check if two dates are the same day
 * @param dateA First date
 * @param dateB Second date
 * @returns Boolean indicating if the dates are the same day
 */
export const checkIfSameDay = (dateA: Date | string, dateB: Date | string): boolean => {
  const dateObjA = typeof dateA === 'string' ? parseISO(dateA) : dateA;
  const dateObjB = typeof dateB === 'string' ? parseISO(dateB) : dateB;
  return isSameDay(dateObjA, dateObjB);
};

/**
 * Generate an array of dates for a given range
 * @param startDate Start date
 * @param days Number of days
 * @returns Array of dates
 */
export const generateDateRange = (startDate: Date | string, days: number): Date[] => {
  const dateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  return Array.from({ length: days }, (_, i) => addDays(dateObj, i));
};
