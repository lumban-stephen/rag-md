import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';

export class DocumentService {
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
    try {
      this.logger.log('S3 List Request', `Listing documents${topic ? ` for topic "${topic}"` : ''}`);
      
      // List both processed and uploads directories
      const [processedResponse, uploadsResponse] = await Promise.all([
        this.s3.listObjectsV2({
          Bucket: config.aws.s3.bucket!,
          Prefix: topic ? `${config.aws.s3.processedPrefix}${topic}/` : config.aws.s3.processedPrefix
        }).promise(),
        this.s3.listObjectsV2({
          Bucket: config.aws.s3.bucket!,
          Prefix: topic ? `${config.aws.s3.uploadsPrefix}${topic}/` : config.aws.s3.uploadsPrefix
        }).promise()
      ]);

      const allObjects = [
        ...(processedResponse.Contents || []),
        ...(uploadsResponse.Contents || [])
      ];

      if (!allObjects.length) {
        this.logger.log('S3 List Response', 'No documents found');
        return [];
      }

      const processedObjects = allObjects.map(object => {
        try {
          const key = object.Key || '';
          const parts = key.split('/');

          // Skip objects that are just the prefix directory itself
          if (parts.length <= 2 || !parts[parts.length - 1]) {
            return null;
          }

          // Determine if the file is still being processed
          const isProcessing = key.startsWith(config.aws.s3.uploadsPrefix);

          const result = {
            filename: parts[parts.length - 1] || '',
            topic: parts[1] || '',
            lastModified: object.LastModified?.toISOString() || new Date().toISOString(),
            size: object.Size || 0,
            status: isProcessing ? 'processing' : 'complete'
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
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    try {
      // Try to delete from both processed and uploads directories
      await Promise.all([
        this.s3.deleteObject({
          Bucket: config.aws.s3.bucket!,
          Key: processedKey
        }).promise(),
        this.s3.deleteObject({
          Bucket: config.aws.s3.bucket!,
          Key: uploadKey
        }).promise()
      ]);

      // After deleting the file, check if there are any remaining files in the topic
      const remainingFiles = await this.listDocuments(topic);
      
      if (remainingFiles.length === 0) {
        // If no files remain, delete the topic directory itself
        await Promise.all([
          this.s3.deleteObject({
            Bucket: config.aws.s3.bucket!,
            Key: `${config.aws.s3.processedPrefix}${topic}/`
          }).promise(),
          this.s3.deleteObject({
            Bucket: config.aws.s3.bucket!,
            Key: `${config.aws.s3.uploadsPrefix}${topic}/`
          }).promise()
        ]);
      }
    } catch (error: any) {
      this.logger.log('Delete Error', `Failed to delete file "${filename}" from topic "${topic}": ${error.message}`);
      throw new Error(`Failed to delete document: ${error.message}`);
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
} 