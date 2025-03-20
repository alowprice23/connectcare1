/**
 * Utils to format dates for display
 */

import { format, formatDistance, parseISO } from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string, formatStr = 'MMM dd, yyyy'): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a date string to a relative time (e.g., "5 minutes ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return dateString;
  }
}
