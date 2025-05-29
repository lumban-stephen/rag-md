import AWS from 'aws-sdk';
import axios from 'axios';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';

export class S3Service {
  private s3: AWS.S3;
  private apiGatewayUrl: string;
  private logger: LoggingService;

  constructor() {
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'https://r0ts5l6wz4.execute-api.us-east-1.amazonaws.com/dev';
    this.logger = LoggingService.getInstance();
  }

  async generatePresignedUrl(topic: string, filename: string): Promise<string> {
    const key = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: key,
      Expires: 3600, // URL expires in 1 hour
      ContentType: 'application/octet-stream'
    };

    try {
      const url = await this.s3.getSignedUrlPromise('putObject', params);
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  async listDocuments(topic?: string): Promise<any[]> {
    const params = {
      Bucket: config.aws.s3.bucket!,
      Prefix: topic ? `${config.aws.s3.processedPrefix}${topic}/` : config.aws.s3.processedPrefix
    };

    try {
      this.logger.log('S3 List Request', `Listing documents${topic ? ` for topic "${topic}"` : ''}`);
      const response = await this.s3.listObjectsV2(params).promise();
      
      if (!response.Contents) {
        this.logger.log('S3 List Response', 'No documents found');
        return [];
      }

      const processedObjects = response.Contents.map(object => {
        try {
          const key = object.Key || '';
          const parts = key.split('/');

          // Skip objects that are just the prefix directory itself
          if (parts.length <= 2 || !parts[parts.length - 1]) {
            return null;
          }

          const result = {
            filename: parts[parts.length - 1] || '',
            topic: parts[1] || '',
            lastModified: object.LastModified?.toISOString() || new Date().toISOString(),
            size: object.Size || 0
          };
          
          return result;
        } catch (error: any) {
          this.logger.log('S3 Processing Error', `Error processing object: ${error.message}`);
          return null;
        }
      }).filter(Boolean);

      this.logger.log('S3 List Response', `Found ${processedObjects.length} documents`);
      return processedObjects;
    } catch (error: any) {
      this.logger.log('S3 Error', `Error listing documents: ${error.message}`);
      throw new Error('Failed to list documents');
    }
  }

  async deleteDocument(topic: string, filename: string): Promise<void> {
    const key = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: key
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  async uploadFile(topic: string, filename: string, fileBuffer: Buffer, contentType: string): Promise<void> {
    const key = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    };

    try {
      await this.s3.upload(params).promise();
      this.logger.log('Document Upload', `File "${filename}" uploaded to topic "${topic}"`);
    } catch (error: any) {
      this.logger.log('Upload Error', `Failed to upload file "${filename}" to topic "${topic}": ${error.message}`);
      throw new Error('Failed to upload file to S3');
    }
  }

  async generateDownloadUrl(topic: string, filename: string): Promise<string> {
    const key = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: key,
      Expires: 3600 // URL expires in 1 hour
    };

    try {
      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async getFileContent(topic: string, filename: string): Promise<string> {
    const key = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: key
    };

    try {
      const response = await this.s3.getObject(params).promise();
      return response.Body?.toString('utf-8') || '';
    } catch (error) {
      console.error('Error getting file content:', error);
      throw new Error('Failed to get file content');
    }
  }

  async updateFileContent(topic: string, filename: string, content: string): Promise<void> {
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: uploadKey,
      Body: content,
      ContentType: 'text/plain'
    };

    try {
      // First delete the existing file to trigger deletion of old index entries
      console.log('Deleting existing file to clear old index entries:', { topic, filename });
      await this.deleteDocument(topic, filename);
      console.log('Successfully deleted existing file');

      // Then upload the new content to the uploads directory to trigger ingestion
      console.log('Uploading new content to trigger ingestion:', { topic, filename, contentLength: content.length });
      await this.s3.putObject(params).promise();
      console.log('Successfully uploaded new content');

      // Poll for ingestion status with timeout
      const maxAttempts = 30; // 5 minutes total (10 seconds * 30)
      const pollInterval = 10000; // 10 seconds
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const status = await this.checkIngestionStatus(topic, filename);
        console.log('Ingestion status:', status);
        
        if (status.status === 'complete') {
          console.log('Ingestion completed successfully');
          return;
        }
        
        if (status.status === 'error') {
          throw new Error(`Ingestion failed: ${status.message}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      throw new Error('Ingestion timed out after 5 minutes');
    } catch (error) {
      console.error('Error updating file content:', error);
      throw new Error('Failed to update file content');
    }
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
} 