/**
 * IngestionStatusService manages the status of document ingestion in S3
 * It tracks whether documents are in the uploads directory (pending ingestion)
 * or in the processed directory (ingestion complete)
 */
import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';
import { S3_CONSTANTS } from '../../constants/s3.constants.js';

export interface IngestionStatus {
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  timestamp?: string;
}

export class IngestionStatusService {
  private s3: AWS.S3;
  private logger: LoggingService;

  constructor() {
    // Initialize AWS S3 client and logging service
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.logger = LoggingService.getInstance();
  }

  /**
   * Checks if a document is still in the uploads directory (pending ingestion)
   * @param topic - The topic of the document
   * @param filename - Name of the file to check
   * @returns True if the file is still in uploads (pending), false if it's been processed
   */
  async isPendingIngestion(topic: string, filename: string): Promise<boolean> {
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    try {
      // Check if file exists in uploads directory
      await this.s3.headObject({
        Bucket: config.aws.s3.bucket!,
        Key: uploadKey
      }).promise();
      
      this.logger.log('Ingestion Status', `File ${filename} is still pending ingestion`);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        this.logger.log('Ingestion Status', `File ${filename} has been processed`);
        return false;
      }
      this.logger.log('Ingestion Status Error', `Error checking ingestion status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if a document has been processed and is in the processed directory
   * @param topic - The topic of the document
   * @param filename - Name of the file to check
   * @returns True if the file is in processed directory, false otherwise
   */
  async isProcessed(topic: string, filename: string): Promise<boolean> {
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    try {
      // Check if file exists in processed directory
      await this.s3.headObject({
        Bucket: config.aws.s3.bucket!,
        Key: processedKey
      }).promise();
      
      this.logger.log('Ingestion Status', `File ${filename} has been processed`);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        this.logger.log('Ingestion Status', `File ${filename} has not been processed`);
        return false;
      }
      this.logger.log('Ingestion Status Error', `Error checking processing status: ${error.message}`);
      throw error;
    }
  }

  async checkIngestionStatus(topic: string, filename: string): Promise<IngestionStatus> {
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
          status: S3_CONSTANTS.STATUS.PROCESSING,
          message: 'File is being processed',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        // If file is not in uploads/, check if it's in processed/
        try {
          const processedFile = await this.s3.headObject(processedParams).promise();
          return {
            status: S3_CONSTANTS.STATUS.COMPLETE,
            message: 'File has been processed',
            timestamp: processedFile.LastModified?.toISOString()
          };
        } catch (error) {
          // If file is not in either location, it might have failed
          return {
            status: S3_CONSTANTS.STATUS.ERROR,
            message: 'File not found in either uploads or processed directories'
          };
        }
      }
    } catch (error) {
      console.error('Error checking ingestion status:', error);
      return {
        status: S3_CONSTANTS.STATUS.ERROR,
        message: 'Failed to check ingestion status'
      };
    }
  }

  async waitForIngestion(topic: string, filename: string, timeoutMs: number = S3_CONSTANTS.INGESTION_TIMEOUT): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkIngestionStatus(topic, filename);
      
      if (status.status === S3_CONSTANTS.STATUS.COMPLETE) {
        return;
      }
      
      if (status.status === S3_CONSTANTS.STATUS.ERROR) {
        throw new Error(`Ingestion failed: ${status.message}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, S3_CONSTANTS.POLL_INTERVAL));
    }
    
    throw new Error(`Ingestion timed out after ${timeoutMs / 1000} seconds`);
  }
} 