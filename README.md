# RAG Management Dashboard

A modern web application for managing Retrieval-Augmented Generation (RAG) pipelines, providing a user-friendly interface for document management, semantic search, and system monitoring.

## 🌟 Features

### Document Management
- **Upload Documents**: 
  - Drag-and-drop interface for uploading PDF, TXT, and MD files
  - Real-time upload progress tracking
  - File type validation and size limits
  - Automatic filename suggestions
- **Topic Organization**: 
  - Create and manage custom topics
  - Automatic topic sorting and deduplication
  - Topic-based document filtering
- **Document Preview**: 
  - View document contents in a modal interface
  - Edit document content with confirmation
  - Real-time content updates
- **Bulk Operations**: 
  - Multi-select document management
  - Bulk deletion with safety checks
  - Topic-based bulk operations

### Search & Retrieval
- **Semantic Search**: 
  - Natural language queries powered by OpenSearch
  - Real-time search results
  - Highlighted matching text
- **Topic Filtering**: 
  - Filter search results by specific topics
  - Dynamic topic list updates
- **Confidence Scoring**: 
  - Visual indicators for match quality
  - Detailed match information
- **Chunk Preview**: 
  - Preview matching text chunks
  - Source document attribution
  - Copy functionality for results

### System Monitoring
- **Real-time Logs**: 
  - Event-based logging system
  - Categorized log entries (Upload, Ingestion, S3, Error)
  - Timestamp tracking
  - Visual status indicators
- **Processing Status**: 
  - Real-time job status tracking
  - Progress indicators
  - Error handling and notifications
  - Automatic status updates
- **System Health**: 
  - S3 bucket status monitoring
  - OpenSearch cluster health
  - Lambda function status
  - Visual health indicators
- **Index Management**: 
  - Manual index refresh
  - Index status monitoring
  - Processing queue management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- AWS Account with configured services:
  - S3 bucket for document storage
  - OpenSearch domain for semantic search
  - Lambda functions for document processing
  - IAM roles and permissions

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd rag-md
   ```

2. Install dependencies:
   ```bash
   # Install all dependencies (client, server, and shared)
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your AWS configuration:
   # - AWS Region
   # - AWS Credentials (access key and secret)
   # - S3 Bucket Name
   # - OpenSearch Domain
   # - API Endpoints
   # - Processing Settings
   ```

4. Start the development servers:
   ```bash
   # Start both frontend and backend servers concurrently
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 🔧 Development

### Available Scripts

```