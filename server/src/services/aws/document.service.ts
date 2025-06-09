/**
 * Options for listing documents
 */
interface ListDocumentsOptions {
  topic?: string;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

/**
 * DocumentService handles all basic document operations in S3
 * including listing, uploading, downloading, and deleting documents
 */
import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';
import { Document, DocumentListResponse } from '../../interfaces/document.types.js';
import { S3_CONSTANTS } from '../../constants/s3.constants.js';

export class DocumentService {
  private s3: AWS.S3;
  private logger: LoggingService;
  private bucketName: string;

  constructor() {
    // Validate AWS configuration
    if (!config.aws.s3.bucket) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    // Initialize AWS S3 client with credentials from config
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.logger = LoggingService.getInstance();
    this.bucketName = config.aws.s3.bucket;

    // Log configuration
    this.logger.log('AWS Configuration', `Initialized S3 service with bucket: ${this.bucketName}`);
  }

  /**
   * Validates that the S3 bucket exists and is accessible
   * @throws Error if bucket is not accessible
   */
  private async validateBucket(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
    } catch (error: any) {
      this.logger.log('AWS Error', `Failed to access S3 bucket: ${error.message}`);
      throw new Error(`Failed to access S3 bucket: ${error.message}`);
    }
  }

  /**
   * Generates a presigned URL for uploading a document to S3
   * @param topic - The topic/category of the document
   * @param filename - Name of the file to be uploaded
   * @returns A presigned URL that can be used to upload the file
   */
  async generatePresignedUrl(topic: string, filename: string): Promise<string> {
    const key = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: S3_CONSTANTS.URL_EXPIRY,
      ContentType: S3_CONSTANTS.CONTENT_TYPES.TEXT
    };

    try {
      const url = await this.s3.getSignedUrlPromise('putObject', params);
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Lists documents in S3 with pagination, filtering, and sorting
   * @param options - Options for listing documents
   * @returns Paginated and filtered document list
   */
  async listDocuments(options: ListDocumentsOptions = {}): Promise<DocumentListResponse> {
    try {
      // Validate bucket access first
      await this.validateBucket();

      const {
        topic,
        search = '',
        sortField = 'lastModified',
        sortDirection = 'desc',
        skip = 0,
        limit = 10
      } = options;

      this.logger.log('S3 List Request', `Listing documents${topic ? ` for topic "${topic}"` : ''}`);
      
      // List both processed and uploads directories in parallel
      const [processedResponse, uploadsResponse] = await Promise.all([
        this.s3.listObjectsV2({
          Bucket: this.bucketName,
          Prefix: topic ? `${config.aws.s3.processedPrefix}${topic}/` : config.aws.s3.processedPrefix
        }).promise(),
        this.s3.listObjectsV2({
          Bucket: this.bucketName,
          Prefix: topic ? `${config.aws.s3.uploadsPrefix}${topic}/` : config.aws.s3.uploadsPrefix
        }).promise()
      ]);

      const allObjects = [
        ...(processedResponse.Contents || []),
        ...(uploadsResponse.Contents || [])
      ];

      if (!allObjects.length) {
        this.logger.log('S3 List Response', 'No documents found');
        return { documents: [], total: 0 };
      }

      // Process and format each object into a Document
      let processedObjects = allObjects.map(object => {
        try {
          const key = object.Key || '';
          const parts = key.split('/');

          // Skip objects that are just the prefix directory itself
          if (parts.length <= 2 || !parts[parts.length - 1]) {
            return null;
          }

          // Determine if the file is still being processed
          const isProcessing = key.startsWith(config.aws.s3.uploadsPrefix);

          const result: Document = {
            key: object.Key || '',
            filename: parts[parts.length - 1] || '',
            topic: parts[1] || '',
            lastModified: new Date(object.LastModified || new Date()),
            size: object.Size || 0,
            status: isProcessing ? S3_CONSTANTS.STATUS.PROCESSING : S3_CONSTANTS.STATUS.COMPLETE
          };
          
          return result;
        } catch (error: any) {
          this.logger.log('S3 Processing Error', `Error processing object: ${error.message}`);
          return null;
        }
      }).filter(Boolean) as Document[];

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        processedObjects = processedObjects.filter(doc => {
          if (search.length === 1) {
            return doc.filename.toLowerCase().startsWith(searchLower);
          }
          return doc.filename.toLowerCase().includes(searchLower);
        });
      }

      // Sort the documents
      processedObjects.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'filename':
            comparison = a.filename.localeCompare(b.filename);
            break;
          case 'topic':
            comparison = a.topic.localeCompare(b.topic);
            break;
          case 'lastModified':
            comparison = a.lastModified.getTime() - b.lastModified.getTime();
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      // Get total count before pagination
      const total = processedObjects.length;

      // Apply pagination
      const paginatedObjects = processedObjects.slice(skip, skip + limit);

      this.logger.log('S3 List Response', `Found ${total} documents, returning ${paginatedObjects.length}`);
      return {
        documents: paginatedObjects,
        total
      };
    } catch (error: any) {
      this.logger.log('S3 Error', `Error listing documents: ${error.message}`);
      throw new Error('Failed to list documents');
    }
  }

  /**
   * Deletes a document from both processed and uploads directories
   * Also removes the topic directory if it's the last document
   * @param topic - The topic of the document
   * @param filename - Name of the file to delete
   */
  async deleteDocument(topic: string, filename: string): Promise<void> {
    const processedKey = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    const uploadKey = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    try {
      // Validate bucket access first
      await this.validateBucket();

      // Try to delete from both processed and uploads directories
      await Promise.all([
        this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: processedKey
        }).promise(),
        this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: uploadKey
        }).promise()
      ]);

      // After deleting the file, check if there are any remaining files in the topic
      const remainingFiles = await this.listDocuments({ topic });
      
      if (remainingFiles.documents.length === 0) {
        // If no files remain, delete the topic directory itself
        await Promise.all([
          this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: `${config.aws.s3.processedPrefix}${topic}/`
          }).promise(),
          this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: `${config.aws.s3.uploadsPrefix}${topic}/`
          }).promise()
        ]);
      }
    } catch (error: any) {
      this.logger.log('Delete Error', `Failed to delete file "${filename}" from topic "${topic}": ${error.message}`);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Uploads a file to the uploads directory to trigger processing
   * @param topic - The topic of the document
   * @param filename - Name of the file
   * @param fileBuffer - The file contents as a buffer
   * @param contentType - MIME type of the file
   */
  async uploadFile(topic: string, filename: string, fileBuffer: Buffer, contentType: string): Promise<void> {
    const key = `${config.aws.s3.uploadsPrefix}${topic}/${filename}`;
    
    try {
      // Validate bucket access first
      await this.validateBucket();

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      };

      await this.s3.upload(params).promise();
      this.logger.log('Document Upload', `File "${filename}" uploaded to topic "${topic}"`);
    } catch (error: any) {
      this.logger.log('Upload Error', `Failed to upload file "${filename}" to topic "${topic}": ${error.message}`);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Generates a presigned URL for downloading a processed document
   * @param topic - The topic of the document
   * @param filename - Name of the file to download
   * @returns A presigned URL that can be used to download the file
   */
  async generateDownloadUrl(topic: string, filename: string): Promise<string> {
    const key = `${config.aws.s3.processedPrefix}${topic}/${filename}`;
    
    try {
      // Validate bucket access first
      await this.validateBucket();

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: S3_CONSTANTS.URL_EXPIRY
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }
} 