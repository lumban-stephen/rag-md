import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3010,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      uploadsPrefix: process.env.AWS_S3_UPLOADS_PREFIX || 'uploads/',
      processedPrefix: process.env.AWS_S3_PROCESSED_PREFIX || 'processed/'
    },
    openSearch: {
      domain: process.env.AWS_OPENSEARCH_DOMAIN,
      index: process.env.AWS_OPENSEARCH_INDEX || 'rag-index'
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://172.28.64.1:5173', 'http://localhost:5173'],
    credentials: true
  },
  apiGateway: {
    url: process.env.VITE_API_BASE_URL || 'https://r0ts5l6wz4.execute-api.us-east-1.amazonaws.com/dev'
  }
} as const;

export type Config = typeof config; 