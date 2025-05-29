# RAG Lambda Functions Summary & App Prompt

This document describes the key Lambda functions powering your Retrieval-Augmented Generation (RAG) pipeline and outlines a project prompt to build a centralized RAG Management App with full CRUD capabilities over your S3 bucket.

---

## ✅ Lambda Functions Overview

### 🟢 `generate_presigned_url.py`
- **Purpose**: Generates a presigned `PUT` URL so users can upload documents directly to S3.
- **Input**: `topic`, `filename` via query string.
- **Output**: Presigned URL valid for direct upload to `uploads/<topic>/<filename>`.

---

### 🟢 `ingest_handler.py`
- **Purpose**: Automatically triggered when a new file is uploaded to `uploads/`.
- **Function**: Extracts text, chunks content, generates embeddings, indexes chunks in OpenSearch, then moves file to `processed/`.
- **Supports**: Overwrites and reprocessing.

---

### 🟢 `retrieve_handler.py`
- **Purpose**: Accepts user queries and returns semantically relevant chunks from OpenSearch.
- **Input**: `query` and optional `topic` in JSON.
- **Output**: List of matched chunks with metadata.

---

### 🟢 `get_bucket_docs.py`
- **Purpose**: Retrieves all indexed documents associated with a specific topic (S3 subdirectory).
- **Input**: `topic` via path or query parameter.
- **Output**: List of documents indexed under that topic.

---

### 🟢 `delete_handler.py`
- **Purpose**: Handles deletion of indexed documents.
- **Modes**:
  - Via API Gateway: delete by filename (`metadata.original_filename`)
  - Via S3 Delete Event: automatically removes matching indexed chunks
- **Features**: Dry-run mode, retries, bulk delete.

---

## 💡 Prompt: Build a RAG Management App

**Goal**: Create a web-based UI to manage your entire RAG pipeline without needing to open the AWS Console.

---

### 🎯 Features

- **Upload New Documents**
  - Choose topic + filename
  - Upload file via presigned URL
  - Trigger ingestion automatically

- **View Indexed Documents**
  - List all documents per topic
  - Show ingestion status and metadata

- **Run Semantic Queries**
  - Enter natural language questions
  - See matching chunks and source files

- **Delete Documents**
  - Select a file and delete all its indexed chunks
  - Supports API-based delete

- **Reprocess a Document**
  - Select an already processed document
  - Re-ingest it via overwrite

---

### 🔧 Tech Stack Suggestions

- **Frontend**: React, Next.js, or Svelte
- **Backend (optional)**: Node.js or Python for proxying API Gateway if needed
- **AWS Integration**:
  - Direct calls to your deployed API Gateway routes
  - File uploads via the `generate-url` endpoint
  - Query and delete using `retrieve`, `get`, and `delete` routes

---

### 📦 Bonus Features (Optional)

- Show OpenSearch index stats
- Show ingestion logs (via CloudWatch Insights)
- Display file previews or chunk-level diffing

---

## ✅ Outcome

With this app, you'll be able to manage document ingestion, search, and cleanup — entirely through a user-friendly interface — boosting the usability and transparency of your RAG workflow.