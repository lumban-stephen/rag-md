/**
 * Constants used for S3 operations across the application
 * These constants define content types, prefixes, and other S3-related configurations
 */

export const S3_CONSTANTS = {
  /**
   * Content types for different file formats
   * Used when uploading files to S3 to ensure proper handling
   */
  CONTENT_TYPES: {
    TEXT: 'text/plain',
    MARKDOWN: 'text/markdown',
    JSON: 'application/json'
  },

  /**
   * S3 key prefixes for different directories
   * Used to organize files in the S3 bucket
   */
  PREFIXES: {
    UPLOADS: 'uploads/',
    PROCESSED: 'processed/',
    TEMP: 'temp/'
  },

  /**
   * Maximum file size allowed for upload (in bytes)
   * Currently set to 10MB
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /**
   * Allowed file extensions for upload
   * Currently supports text, markdown, and JSON files
   */
  ALLOWED_EXTENSIONS: ['.txt', '.md', '.json'],

  URL_EXPIRY: 3600, // 1 hour in seconds
  POLL_INTERVAL: 10000, // 10 seconds in milliseconds
  INGESTION_TIMEOUT: 300000, // 5 minutes in milliseconds
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error'
  }
} as const; 