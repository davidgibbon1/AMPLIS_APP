import { ZoomLevel } from './types';
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  format,
  isSameDay,
  isToday,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns';

export const PIXELS_PER_DAY = 40;
export const PIXELS_PER_WEEK = 280; // 40 * 7
export const PIXELS_PER_MONTH = 1200; // ~40 * 30
export const PIXELS_PER_QUARTER = 3600; // ~40 * 90

export const ROW_HEIGHT = 48;
export const HEADER_HEIGHT = 60;
export const SIDEBAR_WIDTH = 400;

/**
 * Calculate the total number of days in a timeline range
 */
export function getTotalDays(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate) + 1;
}

/**
 * Calculate pixels per day based on available width and timeline range
 */
export function calculateDynamicPixelsPerDay(
  containerWidth: number,
  startDate: Date,
  endDate: Date
): number {
  const totalDays = getTotalDays(startDate, endDate);
  // Ensure minimum width per day for readability
  return Math.max(containerWidth / totalDays, 2);
}

/**
 * Calculate X position for a date with dynamic width
 */
export function dateToXDynamic(
  date: Date,
  timelineStart: Date,
  pixelsPerDay: number
): number {
  const days = differenceInDays(date, timelineStart);
  return days * pixelsPerDay;
}

/**
 * Calculate bar width in pixels with dynamic width
 */
export function calculateBarWidthDynamic(
  startDate: Date,
  endDate: Date,
  pixelsPerDay: number
): number {
  const days = differenceInDays(endDate, startDate) + 1;
  return Math.max(days * pixelsPerDay, 20); // Minimum 20px width
}

/**
 * Convert X position back to date with dynamic width
 */
export function xToDateDynamic(
  x: number,
  timelineStart: Date,
  pixelsPerDay: number
): Date {
  const days = Math.floor(x / pixelsPerDay);
  return addDays(timelineStart, days);
}

/**
 * Calculate today's X position (or -1 if not visible)
 */
export function getTodayXPosition(
  timelineStart: Date,
  timelineEnd: Date,
  pixelsPerDay: number
): number | null {
  const today = startOfDay(new Date());
  if (today < startOfDay(timelineStart) || today > startOfDay(timelineEnd)) {
    return null;
  }
  return dateToXDynamic(today, timelineStart, pixelsPerDay);
}

/**
 * Get the pixel width for a given zoom level
 */
export function getPixelsPerUnit(zoomLevel: ZoomLevel): number {
  switch (zoomLevel) {
    case 'day':
      return PIXELS_PER_DAY;
    case 'week':
      return PIXELS_PER_WEEK;
    case 'month':
      return PIXELS_PER_MONTH;
    case 'quarter':
      return PIXELS_PER_QUARTER;
    default:
      return PIXELS_PER_WEEK;
  }
}

/**
 * Snap a date to the nearest unit based on zoom level
 */
export function snapToGrid(date: Date, zoomLevel: ZoomLevel): Date {
  switch (zoomLevel) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
      return startOfMonth(date);
    case 'quarter':
      return startOfQuarter(date);
    default:
      return startOfWeek(date, { weekStartsOn: 1 });
  }
}

/**
 * Calculate the X position of a date on the timeline
 */
export function dateToX(date: Date, timelineStart: Date, zoomLevel: ZoomLevel): number {
  const pixelsPerUnit = getPixelsPerUnit(zoomLevel);
  
  switch (zoomLevel) {
    case 'day':
      const days = differenceInDays(date, timelineStart);
      return days * pixelsPerUnit;
    case 'week':
      const weeks = differenceInWeeks(date, timelineStart);
      return weeks * pixelsPerUnit;
    case 'month':
      const months = differenceInMonths(date, timelineStart);
      return months * pixelsPerUnit;
    case 'quarter':
      const quarters = Math.floor(differenceInMonths(date, timelineStart) / 3);
      return quarters * pixelsPerUnit;
    default:
      return 0;
  }
}

/**
 * Calculate a date from an X position on the timeline
 */
export function xToDate(x: number, timelineStart: Date, zoomLevel: ZoomLevel): Date {
  const pixelsPerUnit = getPixelsPerUnit(zoomLevel);
  const units = Math.floor(x / pixelsPerUnit);
  
  switch (zoomLevel) {
    case 'day':
      return addDays(timelineStart, units);
    case 'week':
      return addWeeks(timelineStart, units);
    case 'month':
      return addMonths(timelineStart, units);
    case 'quarter':
      return addMonths(timelineStart, units * 3);
    default:
      return timelineStart;
  }
}

/**
 * Calculate the width of a task bar in pixels
 */
export function calculateBarWidth(
  startDate: Date,
  endDate: Date,
  zoomLevel: ZoomLevel
): number {
  const pixelsPerUnit = getPixelsPerUnit(zoomLevel);
  
  switch (zoomLevel) {
    case 'day':
      const days = differenceInDays(endDate, startDate) + 1; // +1 to include both start and end
      return days * pixelsPerUnit;
    case 'week':
      const weeks = differenceInWeeks(endDate, startDate);
      return Math.max(weeks * pixelsPerUnit, pixelsPerUnit / 7); // Minimum 1 day visible
    case 'month':
      const months = differenceInMonths(endDate, startDate);
      return Math.max(months * pixelsPerUnit, pixelsPerUnit / 30);
    case 'quarter':
      const quarters = Math.floor(differenceInMonths(endDate, startDate) / 3);
      return Math.max(quarters * pixelsPerUnit, pixelsPerUnit / 90);
    default:
      return 0;
  }
}

/**
 * Generate timeline intervals for the header
 */
export function generateTimelineIntervals(
  startDate: Date,
  endDate: Date,
  zoomLevel: ZoomLevel
): Array<{ date: Date; label: string; x: number }> {
  const intervals: Array<{ date: Date; label: string; x: number }> = [];
  const pixelsPerUnit = getPixelsPerUnit(zoomLevel);
  
  switch (zoomLevel) {
    case 'day':
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      days.forEach((day, index) => {
        intervals.push({
          date: day,
          label: format(day, 'MMM d'),
          x: index * pixelsPerUnit
        });
      });
      break;
    case 'week':
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );
      weeks.forEach((week, index) => {
        intervals.push({
          date: week,
          label: format(week, 'MMM d'),
          x: index * pixelsPerUnit
        });
      });
      break;
    case 'month':
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      months.forEach((month, index) => {
        intervals.push({
          date: month,
          label: format(month, 'MMM yyyy'),
          x: index * pixelsPerUnit
        });
      });
      break;
    case 'quarter':
      const allMonths = eachMonthOfInterval({ start: startDate, end: endDate });
      const quarters = allMonths.filter((_, index) => index % 3 === 0);
      quarters.forEach((quarter, index) => {
        intervals.push({
          date: quarter,
          label: `Q${Math.floor(quarter.getMonth() / 3) + 1} ${quarter.getFullYear()}`,
          x: index * pixelsPerUnit
        });
      });
      break;
  }
  
  return intervals;
}

/**
 * Calculate the timeline date range based on project dates with padding
 */
export function calculateTimelineRange(
  projectStart: Date | null,
  projectEnd: Date | null,
  zoomLevel: ZoomLevel
): { start: Date; end: Date } {
  const now = new Date();
  const defaultStart = startOfMonth(addMonths(now, -1));
  const defaultEnd = endOfMonth(addMonths(now, 3));
  
  let start = projectStart ? new Date(projectStart) : defaultStart;
  let end = projectEnd ? new Date(projectEnd) : defaultEnd;
  
  // Add padding
  switch (zoomLevel) {
    case 'day':
      start = addDays(start, -7);
      end = addDays(end, 7);
      break;
    case 'week':
      start = addWeeks(start, -2);
      end = addWeeks(end, 2);
      break;
    case 'month':
      start = addMonths(start, -1);
      end = addMonths(end, 1);
      break;
    case 'quarter':
      start = addMonths(start, -3);
      end = addMonths(end, 3);
      break;
  }
  
  return { start, end };
}

/**
 * Format a date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return format(start, 'MMM d, yyyy');
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Check if two task date ranges overlap
 */
export function tasksOverlap(
  task1Start: Date,
  task1End: Date,
  task2Start: Date,
  task2End: Date
): boolean {
  return task1Start <= task2End && task2Start <= task1End;
}

/**
 * Calculate business days between two dates (excludes weekends)
 */
export function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}





