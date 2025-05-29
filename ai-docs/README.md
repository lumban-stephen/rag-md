# RAG Management App

## Overview
This project is a web-based UI designed to manage a Retrieval-Augmented Generation (RAG) pipeline. It provides a centralized interface for uploading, viewing, querying, and deleting documents without requiring direct access to the AWS Console.

## Current Status
- **Frontend**: The project is built using React and Vite. The main entry point is `src/main.tsx`, and the app is structured with components, types, and API integration.
- **Lambda Functions**: The backend is powered by several AWS Lambda functions:
  - `generate_presigned_url.py`: Generates a presigned URL for direct document uploads to S3.
  - `ingest_handler.py`: Automatically processes uploaded files, extracts text, generates embeddings, and indexes them in OpenSearch.
  - `retrieve_handler.py`: Accepts user queries and returns semantically relevant chunks from OpenSearch.
  - `get_bucket_docs.py`: Retrieves all indexed documents for a specific topic.
  - `delete_handler.py`: Handles document deletion, supporting both API-based and S3 event-triggered deletion.

## Features Implemented
- **Upload New Documents**: Users can choose a topic and filename, upload files via a presigned URL, and trigger automatic ingestion.
- **View Indexed Documents**: The app lists all documents per topic, displaying ingestion status and metadata.
- **Run Semantic Queries**: Users can enter natural language questions and view matching chunks and source files.
- **Delete Documents**: The app supports selecting a file and deleting all its indexed chunks.
- **Reprocess a Document**: Users can re-ingest already processed documents via overwrite.

## Next Steps
- **Backend Integration**: Implement a backend (e.g., Node.js or Python) to proxy API Gateway calls if needed.
- **AWS Integration**: Ensure direct calls to deployed API Gateway routes for file uploads, queries, and deletions.
- **Bonus Features**: Consider adding features such as displaying OpenSearch index stats, ingestion logs via CloudWatch Insights, and file previews or chunk-level diffing.

## Backend Integration
To integrate a backend for the RAG Management App, consider the following steps:

1. **Choose a Backend Technology**: Decide between Node.js or Python for your backend. Both are suitable for proxying API Gateway calls.

2. **Set Up a Backend Server**: Create a server that can handle requests from the frontend and communicate with AWS services. This server will act as a proxy for your API Gateway routes.

3. **Implement API Endpoints**: Develop endpoints that correspond to your Lambda functions, such as generating presigned URLs, handling file uploads, and managing document retrieval and deletion.

4. **Secure Your Backend**: Ensure that your backend is secure, especially when handling AWS credentials and API keys. Use environment variables to manage sensitive information.

5. **Connect Frontend to Backend**: Update your frontend to make API calls to your backend server instead of directly to AWS services.

6. **Test and Deploy**: Thoroughly test your backend integration and deploy it to a suitable hosting environment.

## Bucket Selection Feature
In the top bar of the application, you can implement a feature to select which S3 bucket you want to access. This can be done by:

- Adding a dropdown or input field in the UI to select the bucket.
- Updating the backend to handle the selected bucket and adjust API calls accordingly.
- Ensuring that the selected bucket is used in all relevant operations, such as file uploads and retrievals.

This feature will enhance the flexibility of your application, allowing users to manage documents across different buckets seamlessly.

## How to Run
1. Ensure Node.js is installed.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open the provided local URL (e.g., `http://localhost:5173`) in your browser to view the app.

## Build and Preview
- To build for production:
  ```
  npm run build
  ```
- To preview the production build:
  ```
  npm run preview
  ```

## Conclusion
This README provides an overview of the current state of the RAG Management App and outlines the next steps for further development and integration. 