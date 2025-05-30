import { DocumentService } from './document.service.js';
import { FileContentService } from './file-content.service.js';
import { IngestionStatusService } from './ingestion-status.service.js';

export class S3Service {
  private documentService: DocumentService;
  private fileContentService: FileContentService;
  private ingestionStatusService: IngestionStatusService;

  constructor() {
    this.documentService = new DocumentService();
    this.fileContentService = new FileContentService();
    this.ingestionStatusService = new IngestionStatusService();
  }

  // Document operations
  async generatePresignedUrl(topic: string, filename: string): Promise<string> {
    return this.documentService.generatePresignedUrl(topic, filename);
  }

  async listDocuments(topic?: string): Promise<any[]> {
    return this.documentService.listDocuments(topic);
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

  async updateFileContent(topic: string, filename: string, content: string): Promise<void> {
    await this.fileContentService.updateFileContent(topic, filename, content);
    await this.ingestionStatusService.waitForIngestion(topic, filename);
  }

  // Ingestion status operations
  async checkIngestionStatus(topic: string, filename: string) {
    return this.ingestionStatusService.checkIngestionStatus(topic, filename);
  }
} 