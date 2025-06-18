import AWS from 'aws-sdk';
import { DocumentService } from './document.service.js';
import { FileContentService } from './file-content.service.js';
import { IngestionStatusService } from './ingestion-status.service.js';
import { config } from '../../config/env.js';
import { DocumentListResponse } from '../../interfaces/document.types.js';

export class S3Service {
  private documentService: DocumentService;
  private fileContentService: FileContentService;
  private ingestionStatusService: IngestionStatusService;
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    // Initialize AWS configuration
    AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });

    this.documentService = new DocumentService();
    this.fileContentService = new FileContentService();
    this.ingestionStatusService = new IngestionStatusService();
    this.s3 = new AWS.S3();
    this.bucketName = config.aws.s3.bucket || '';
  }

  // Document operations
  async generatePresignedUrl(topic: string, filename: string): Promise<string> {
    return this.documentService.generatePresignedUrl(topic, filename);
  }

  async listDocuments(options?: { topic?: string }): Promise<DocumentListResponse> {
    return this.documentService.listDocuments(options);
  }

  async deleteDocument(topic: string, filename: string): Promise<void> {
    return this.documentService.deleteDocument(topic, filename);
  }

  async uploadFile(topic: string, filename: string, fileBuffer: Buffer, contentType: string): Promise<void> {
    return this.documentService.uploadFile(topic, filename, fileBuffer, contentType);
  }

  async generateDownloadUrl(topic: string, filename: string): Promise<string> {
    return this.documentService.generateDownloadUrl(topic, filename);
  }

  // File content operations
  async getFileContent(topic: string, filename: string): Promise<string> {
    return this.fileContentService.getFileContent(topic, filename);
  }

  /**
   * Checks if a file exists in either processed or uploads directory
   * @param topic - The topic of the document
   * @param filename - Name of the file to check
   * @returns True if the file exists in either directory
   */
  async checkFileExists(topic: string, filename: string): Promise<boolean> {
    try {
      // Try to get the file content - if it succeeds, the file exists
      await this.getFileContent(topic, filename);
      return true;
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return false;
      }
      throw error;
    }
  }

  async updateFileContent(topic: string, filename: string, content: string): Promise<void> {
    await this.fileContentService.updateFileContent(topic, filename, content);
    await this.ingestionStatusService.waitForIngestion(topic, filename);
  }

  // Ingestion status operations
  async checkIngestionStatus(topic: string, filename: string) {
    return this.ingestionStatusService.checkIngestionStatus(topic, filename);
  }

  // Topic operations
  async getAllTopics(): Promise<string[]> {
    try {
      console.log('Getting all topics...');
      
      // List both processed and uploads directories in parallel
      const [processedResponse, uploadsResponse] = await Promise.all([
        this.s3.listObjectsV2({
          Bucket: this.bucketName,
          Prefix: config.aws.s3.processedPrefix,
          Delimiter: '/'
        }).promise(),
        this.s3.listObjectsV2({
          Bucket: this.bucketName,
          Prefix: config.aws.s3.uploadsPrefix,
          Delimiter: '/'
        }).promise()
      ]);

      // Combine and deduplicate topics from both directories
      const allPrefixes = [
        ...(processedResponse.CommonPrefixes || []),
        ...(uploadsResponse.CommonPrefixes || [])
      ];

      const topics = Array.from(new Set(
        allPrefixes
          .map(prefix => prefix.Prefix?.split('/')[1]) // Get the topic name from the prefix
          .filter((topic): topic is string => Boolean(topic)) // Remove null/undefined/empty strings
      ));

      console.log('Extracted topics:', topics);
      return topics;
    } catch (error) {
      console.error('Error in getAllTopics:', error);
      throw error;
    }
  }
} 