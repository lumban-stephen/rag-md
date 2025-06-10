/**
 * CloudWatchService handles interaction with AWS CloudWatch Logs
 * Provides functionality to retrieve and monitor Lambda function logs
 */
import AWS from 'aws-sdk';
import { config } from '../../config/env.js';
import { LoggingService } from '../logging.service.js';

export interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
}

export class CloudWatchService {
  private cloudWatchLogs: AWS.CloudWatchLogs;
  private logger: LoggingService;

  constructor() {
    // Initialize AWS CloudWatch Logs client
    this.cloudWatchLogs = new AWS.CloudWatchLogs({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    });
    this.logger = LoggingService.getInstance();
  }

  /**
   * Retrieves the latest log stream for a Lambda function
   * @param functionName - Name of the Lambda function
   * @returns The name of the latest log stream
   */
  async getLatestLogStream(functionName: string): Promise<string> {
    try {
      const params = {
        logGroupName: `/aws/lambda/${functionName}`,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1
      };

      const response = await this.cloudWatchLogs.describeLogStreams(params).promise();
      const logStream = response.logStreams?.[0];

      if (!logStream) {
        throw new Error(`No log streams found for function ${functionName}`);
      }

      return logStream.logStreamName!;
    } catch (error: any) {
      this.logger.log('CloudWatch Error', `Failed to get latest log stream: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves log events from a specific log stream
   * @param functionName - Name of the Lambda function
   * @param limit - Maximum number of log events to retrieve
   * @returns Array of log events
   */
  async getLogEvents(functionName: string, limit: number = 100): Promise<LogEvent[]> {
    try {
      const logStreamName = await this.getLatestLogStream(functionName);

      const params = {
        logGroupName: `/aws/lambda/${functionName}`,
        logStreamName,
        limit,
        startFromHead: false
      };

      const response = await this.cloudWatchLogs.getLogEvents(params).promise();
      
      return (response.events || []).map(event => ({
        timestamp: event.timestamp!,
        message: event.message!,
        logStreamName
      }));
    } catch (error: any) {
      this.logger.log('CloudWatch Error', `Failed to get log events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves log events for a specific document processing
   * @param topic - The topic of the document
   * @param filename - Name of the file
   * @param limit - Maximum number of log events to retrieve
   * @returns Array of log events related to the document processing
   */
  async getDocumentProcessingLogs(topic: string, filename: string, limit: number = 100): Promise<LogEvent[]> {
    try {
      const events = await this.getLogEvents('ingest_handler', limit);
      
      // Filter logs related to the specific document
      const documentKey = `${topic}/${filename}`;
      return events.filter(event => 
        event.message.includes(documentKey) || 
        event.message.includes(filename)
      );
    } catch (error: any) {
      this.logger.log('CloudWatch Error', `Failed to get document processing logs: ${error.message}`);
      throw error;
    }
  }
} 