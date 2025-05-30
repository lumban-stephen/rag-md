export const S3_CONSTANTS = {
  URL_EXPIRY: 3600, // 1 hour in seconds
  POLL_INTERVAL: 10000, // 10 seconds in milliseconds
  INGESTION_TIMEOUT: 300000, // 5 minutes in milliseconds
  CONTENT_TYPES: {
    TEXT: 'text/plain',
    OCTET_STREAM: 'application/octet-stream'
  },
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error'
  }
} as const; 