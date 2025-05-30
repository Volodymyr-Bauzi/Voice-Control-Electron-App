/**
 * Utility functions for file operations
 */

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension (without dot)
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
}

/**
 * Check if a file path is an image
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file is an image
 */
export function isImageFile(filePath) {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const ext = getFileExtension(filePath);
  return imageExtensions.includes(ext);
}

/**
 * Check if a file path is a video
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file is a video
 */
export function isVideoFile(filePath) {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
  const ext = getFileExtension(filePath);
  return videoExtensions.includes(ext);
}

/**
 * Check if a file path is an audio file
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if the file is an audio file
 */
export function isAudioFile(filePath) {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
  const ext = getFileExtension(filePath);
  return audioExtensions.includes(ext);
}

/**
 * Get file icon based on file extension
 * @param {string} filename - The filename or path
 * @returns {string} Icon class or emoji
 */
export function getFileIcon(filename) {
  const ext = getFileExtension(filename);
  
  // Document icons
  const documentIcons = {
    pdf: '📄',
    doc: '📄',
    docx: '📄',
    xls: '📊',
    xlsx: '📊',
    ppt: '📑',
    pptx: '📑',
    txt: '📝',
    rtf: '📝',
    md: '📝',
    csv: '📊',
    json: '🔣',
    xml: '🔣',
    yml: '🔣',
    yaml: '🔣',
    html: '🌐',
    htm: '🌐',
    css: '🎨',
    js: '📜',
    ts: '📜',
    jsx: '⚛️',
    tsx: '⚛️',
    py: '🐍',
    java: '☕',
    c: '🔧',
    cpp: '🔧',
    h: '🔧',
    hpp: '🔧',
    cs: '🔷',
    go: '🐹',
    php: '🐘',
    rb: '💎',
    swift: '🐦',
    kt: '🔥',
    rs: '🦀',
    sh: '💻',
    bat: '💻',
    ps1: '💻',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    bz2: '📦',
    xz: '📦',
    dmg: '💾',
    exe: '⚙️',
    msi: '⚙️',
    apk: '📱',
    ipa: '📱',
  };
  
  // Check for document icons first
  if (documentIcons[ext]) {
    return documentIcons[ext];
  }
  
  // Check for media files
  if (isImageFile(filename)) return '🖼️';
  if (isVideoFile(filename)) return '🎬';
  if (isAudioFile(filename)) return '🎵';
  
  // Default file icon
  return '📄';
}

/**
 * Read file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} Promise that resolves with file content
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Read file as data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} Promise that resolves with data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} Promise that resolves with ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create a download link for a file
 * @param {string} data - The file data
 * @param {string} filename - The filename
 * @param {string} [type] - The MIME type
 */
export function downloadFile(data, filename, type) {
  const blob = new Blob([data], type ? { type } : undefined);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
