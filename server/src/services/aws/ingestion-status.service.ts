import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';

export class IngestionStatusService {
  private s3: AWS.S3;
  private logger: LoggingService;

  constructor() {
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.logger = LoggingService.getInstance();
  }

  async checkIngestionStatus(topic: string, filename: string): Promise<{
    status: 'pending' | 'processing' | 'complete' | 'error';
    message: string;
    timestamp?: string;
  }> {
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;

    try {
      // Check if file exists in uploads/
      const uploadParams = {
        Bucket: config.aws.s3.bucket!,
        Key: uploadKey
      };

      // Check if file exists in processed/
      const processedParams = {
        Bucket: config.aws.s3.bucket!,
        Key: processedKey
      };

      try {
        // If file is in uploads/, it's still being processed
        await this.s3.headObject(uploadParams).promise();
        return {
          status: 'processing',
          message: 'File is being processed',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        // If file is not in uploads/, check if it's in processed/
        try {
          const processedFile = await this.s3.headObject(processedParams).promise();
          return {
            status: 'complete',
            message: 'File has been processed',
            timestamp: processedFile.LastModified?.toISOString()
          };
        } catch (error) {
          // If file is not in either location, it might have failed
          return {
            status: 'error',
            message: 'File not found in either uploads or processed directories'
          };
        }
      }
    } catch (error) {
      console.error('Error checking ingestion status:', error);
      return {
        status: 'error',
        message: 'Failed to check ingestion status'
      };
    }
  }

  async waitForIngestion(topic: string, filename: string, timeoutMs: number = 300000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkIngestionStatus(topic, filename);
      
      if (status.status === 'complete') {
        return;
      }
      
      if (status.status === 'error') {
        throw new Error(`Ingestion failed: ${status.message}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Ingestion timed out after ${timeoutMs / 1000} seconds`);
  }
} 