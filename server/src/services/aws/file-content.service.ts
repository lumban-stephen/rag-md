import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';
import { DocumentService } from './document.service.js';

export class FileContentService {
  private s3: AWS.S3;
  private logger: LoggingService;
  private documentService: DocumentService;

  constructor() {
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.logger = LoggingService.getInstance();
    this.documentService = new DocumentService();
  }

  async getFileContent(topic: string, filename: string): Promise<string> {
    // Try processed directory first
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    this.logger.log('File Content Request', `Attempting to get content for ${filename} in topic ${topic}`);
    
    try {
      // First try to get from processed directory
      const processedParams = {
        Bucket: config.aws.s3.bucket!,
        Key: processedKey
      };

      try {
        this.logger.log('File Content Request', `Checking processed directory: ${processedKey}`);
        const response = await this.s3.getObject(processedParams).promise();
        this.logger.log('File Content Response', `Found file in processed directory: ${processedKey}`);
        return response.Body?.toString('utf-8') || '';
      } catch (error: any) {
        // If not in processed, try uploads directory
        if (error.code === 'NoSuchKey') {
          this.logger.log('File Content Request', `File not found in processed directory, checking uploads: ${uploadKey}`);
          const uploadParams = {
            Bucket: config.aws.s3.bucket!,
            Key: uploadKey
          };
          
          try {
            const uploadResponse = await this.s3.getObject(uploadParams).promise();
            this.logger.log('File Content Response', `Found file in uploads directory: ${uploadKey}`);
            return uploadResponse.Body?.toString('utf-8') || '';
          } catch (uploadError: any) {
            if (uploadError.code === 'NoSuchKey') {
              this.logger.log('File Content Error', `File not found in either directory: ${filename}`);
              throw new Error(`File "${filename}" not found in either processed or uploads directory`);
            }
            throw uploadError;
          }
        }
        throw error;
      }
    } catch (error: any) {
      this.logger.log('File Content Error', `Error getting file content: ${error.message}`);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  async updateFileContent(topic: string, filename: string, content: string): Promise<void> {
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: config.aws.s3.bucket!,
      Key: uploadKey,
      Body: content,
      ContentType: 'text/plain'
    };

    try {
      // First delete the existing file to trigger deletion of old index entries
      console.log('Deleting existing file to clear old index entries:', { topic, filename });
      await this.documentService.deleteDocument(topic, filename);
      console.log('Successfully deleted existing file');

      // Then upload the new content to the uploads directory to trigger ingestion
      console.log('Uploading new content to trigger ingestion:', { topic, filename, contentLength: content.length });
      await this.s3.putObject(params).promise();
      console.log('Successfully uploaded new content');
    } catch (error) {
      console.error('Error updating file content:', error);
      throw new Error('Failed to update file content');
    }
  }
} 