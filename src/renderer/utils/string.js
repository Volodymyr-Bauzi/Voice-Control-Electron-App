/**
 * Utility functions for string manipulation and validation
 */

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string to title case
 * @param {string} str - The string to convert
 * @returns {string} The title-cased string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\b\w+/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

/**
 * Generate a random string of specified length
 * @param {number} length - The length of the random string
 * @returns {string} A random string
 */
export function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Truncate a string to a specified length and add an ellipsis
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length of the string
 * @param {string} [ellipsis='...'] - The ellipsis string to append
 * @returns {string} The truncated string
 */
export function truncate(str, maxLength, ellipsis = '...') {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength) + ellipsis;
}

/**
 * Check if a string is empty or contains only whitespace
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is empty or contains only whitespace
 */
export function isBlank(str) {
  return !str || /^\s*$/.test(str);
}

/**
 * Remove all whitespace from a string
 * @param {string} str - The string to process
 * @returns {string} The string with all whitespace removed
 */
export function removeWhitespace(str) {
  return str ? str.replace(/\s+/g, '') : '';
}

/**
 * Convert a string to kebab-case
 * @param {string} str - The string to convert
 * @returns {string} The kebab-cased string
 */
export function toKebabCase(str) {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to camelCase
 * @param {string} str - The string to convert
 * @returns {string} The camelCased string
 */
export function toCamelCase(str) {
  if (!str) return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => 
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/[\s-]+/g, '');
}

/**
 * Convert a string to PascalCase
 * @param {string} str - The string to convert
 * @returns {string} The PascalCased string
 */
export function toPascalCase(str) {
  if (!str) return '';
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a string to snake_case
 * @param {string} str - The string to convert
 * @returns {string} The snake_cased string
 */
export function toSnakeCase(str) {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Check if a string contains HTML tags
 * @param {string} str - The string to check
 * @returns {boolean} True if the string contains HTML tags
 */
export function containsHTML(str) {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Escape HTML special characters
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Unescape HTML entities
 * @param {string} str - The string to unescape
 * @returns {string} The unescaped string
 */
export function unescapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return div.textContent || '';
}

/**
 * Generate a slug from a string
 * @param {string} str - The string to convert to a slug
 * @returns {string} The slugified string
 */
export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Check if a string is a valid email address
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Check if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get the domain from a URL
 * @param {string} url - The URL to extract the domain from
 * @returns {string} The domain name or an empty string if invalid
 */
export function getDomainFromUrl(url) {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Generate a hash code from a string
 * @param {string} str - The string to hash
 * @returns {number} A 32-bit integer hash
 */
export function hashCode(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Count the number of words in a string
 * @param {string} str - The string to count words in
 * @returns {number} The number of words
 */
export function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count the number of characters in a string (supports Unicode)
 * @param {string} str - The string to count characters in
 * @returns {number} The number of characters
 */
export function countChars(str) {
  if (!str) return 0;
  return Array.from(str).length;
}

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid JSON
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is valid JSON
 */
export function isValidJson(str) {
  if (!str) return false;
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Format a string with placeholders
 * @param {string} str - The string with placeholders
 * @param {Object} values - The values to replace placeholders with
 * @returns {string} The formatted string
 * @example
 * formatString('Hello {name}!', { name: 'World' }) // 'Hello World!'
 */
export function formatString(str, values) {
  if (!str) return '';
  return str.replace(/\{([^}]+)\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}
