import AWS from 'aws-sdk';

export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3();
    this.bucketName = process.env.AWS_S3_BUCKET || '';
  }

  /**
   * Get all available topics from S3
   * @returns Array of unique topic names
   */
  async getAllTopics(): Promise<string[]> {
    console.log('Getting all topics from S3 bucket:', this.bucketName);
    
    if (!this.bucketName) {
      console.error('S3 bucket name is not configured');
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Delimiter: '/'
      };
      console.log('S3 listObjectsV2 params:', params);

      // First check if we can access the bucket
      try {
        await this.s3.headBucket({ Bucket: this.bucketName }).promise();
        console.log('Successfully accessed bucket:', this.bucketName);
      } catch (error: any) {
        console.error('Error accessing bucket:', error);
        throw new Error(`Cannot access bucket ${this.bucketName}: ${error.message || 'Unknown error'}`);
      }

      const data = await this.s3.listObjectsV2(params).promise();
      console.log('S3 listObjectsV2 response:', data);

      if (!data.CommonPrefixes) {
        console.log('No common prefixes found in bucket');
        return [];
      }

      const topics = data.CommonPrefixes
        .map(prefix => prefix.Prefix?.replace('/', ''))
        .filter((topic): topic is string => Boolean(topic));

      console.log('Extracted topics:', topics);
      return topics;
    } catch (error: any) {
      console.error('Error getting topics from S3:', error);
      throw new Error(`Failed to get topics: ${error.message || 'Unknown error'}`);
    }
  }
} 