/**
 * Utility functions for date and time manipulation
 */

/**
 * Format a date string or Date object into a human-readable format
 * @param {Date|string|number} date - The date to format
 * @param {string} [format='relative'] - The format to use: 'relative', 'short', 'medium', 'long', 'full', or a custom format string
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'relative') {
  if (!date) return '';
  
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);
  
  // Relative time formats
  if (format === 'relative') {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    // For older dates, fall back to a standard format
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Standard date formats
  const formatOptions = {
    short: { 
      year: '2-digit', 
      month: 'short', 
      day: 'numeric' 
    },
    medium: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    long: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    },
    full: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      hour12: true
    }
  };
  
  if (format in formatOptions) {
    return d.toLocaleString(undefined, formatOptions[format]);
  }
  
  // Custom format string
  const pad = (n) => n < 10 ? `0${n}` : n;
  const parts = {
    'YYYY': d.getFullYear(),
    'YY': String(d.getFullYear()).slice(-2),
    'MMMM': d.toLocaleString('default', { month: 'long' }),
    'MMM': d.toLocaleString('default', { month: 'short' }),
    'MM': pad(d.getMonth() + 1),
    'M': d.getMonth() + 1,
    'DD': pad(d.getDate()),
    'D': d.getDate(),
    'dddd': d.toLocaleString('default', { weekday: 'long' }),
    'ddd': d.toLocaleString('default', { weekday: 'short' }),
    'HH': pad(d.getHours()),
    'H': d.getHours(),
    'hh': pad(d.getHours() % 12 || 12),
    'h': d.getHours() % 12 || 12,
    'mm': pad(d.getMinutes()),
    'm': d.getMinutes(),
    'ss': pad(d.getSeconds()),
    's': d.getSeconds(),
    'A': d.getHours() >= 12 ? 'PM' : 'AM',
    'a': d.getHours() >= 12 ? 'pm' : 'am'
  };
  
  return format.replace(/(YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a)/g, 
    match => parts[match] || match);
}

/**
 * Get the difference between two dates in a human-readable format
 * @param {Date|string|number} date1 - The first date
 * @param {Date|string|number} [date2=new Date()] - The second date (defaults to now)
 * @returns {string} Human-readable time difference
 */
export function timeAgo(date1, date2 = new Date()) {
  const d1 = typeof date1 === 'string' || typeof date1 === 'number' 
    ? new Date(date1) 
    : date1;
  const d2 = typeof date2 === 'string' || typeof date2 === 'number'
    ? new Date(date2)
    : date2;
    
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 'Invalid Date';
  
  const diffInSeconds = Math.floor(Math.abs(d2 - d1) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  // Less than an hour
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a month
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  // Years
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Check if a date is today
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
    
  if (isNaN(d.getTime())) return false;
  
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is yesterday
 * @param {Date|string|number} date - The date to check
 * @returns {boolean} True if the date is yesterday
 */
export function isYesterday(date) {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
    
  if (isNaN(d.getTime())) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
}

/**
 * Get the start of the day for a given date
 * @param {Date} [date=new Date()] - The date
 * @returns {Date} The start of the day (00:00:00.000)
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the day for a given date
 * @param {Date} [date=new Date()] - The date
 * @returns {Date} The end of the day (23:59:59.999)
 */
export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add time to a date
 * @param {Date} date - The date to add time to
 * @param {number} amount - The amount to add
 * @param {string} unit - The unit of time: 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'
 * @returns {Date} A new Date object with the time added
 */
export function addTime(date, amount, unit) {
  const d = new Date(date);
  const units = {
    milliseconds: () => d.setMilliseconds(d.getMilliseconds() + amount),
    seconds: () => d.setSeconds(d.getSeconds() + amount),
    minutes: () => d.setMinutes(d.getMinutes() + amount),
    hours: () => d.setHours(d.getHours() + amount),
    days: () => d.setDate(d.getDate() + amount),
    months: () => d.setMonth(d.getMonth() + amount),
    years: () => d.setFullYear(d.getFullYear() + amount)
  };
  
  if (units[unit]) {
    units[unit]();
    return d;
  }
  
  throw new Error(`Invalid time unit: ${unit}`);
}

/**
 * Get the difference between two dates in the specified unit
 * @param {Date} date1 - The first date
 * @param {Date} [date2=new Date()] - The second date (defaults to now)
 * @param {string} [unit='milliseconds'] - The unit of time: 'milliseconds', 'seconds', 'minutes', 'hours', 'days'
 * @returns {number} The difference in the specified unit
 */
export function dateDiff(date1, date2 = new Date(), unit = 'milliseconds') {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = d2 - d1;
  
  const units = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
    days: 1000 * 60 * 60 * 24
  };
  
  if (units[unit] === undefined) {
    throw new Error(`Invalid unit: ${unit}. Must be one of: ${Object.keys(units).join(', ')}`);
  }
  
  return Math.floor(diff / units[unit]);
}
