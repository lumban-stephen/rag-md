# Backend Integration Checklist for RAG Management App

This checklist outlines all backend-related components required to complete the integration between the RAG Management App frontend and the deployed AWS Lambda infrastructure. The purpose is to guide implementation by identifying what's already completed in AWS and what the backend proxy service needs to support.

---

## ✅ Core Lambda Routes (Already Deployed via AWS Console)

### 1. `GET /generate-url`
- ✅ **Purpose**: Get a presigned S3 PUT URL to upload a document.
- ✅ **Linked Lambda**: `generate_presigned_url.py`
- ✅ **Status**: Implemented in AWS
- 🛠️ **To Do** (Backend proxy):
  - [ ] Add a route handler: `GET /api/generate-url?topic={topic}&filename={filename}`
  - [ ] Forward query params to the AWS API Gateway endpoint.
  - [ ] Return the presigned URL and key to the frontend.

---

### 2. `GET /items/{subdirectory}`
- ✅ **Purpose**: List all indexed documents under a topic.
- ✅ **Linked Lambda**: `get_bucket_docs.py`
- ✅ **Status**: Implemented in AWS
- 🛠️ **To Do**:
  - [ ] Create route: `GET /api/items/:subdirectory`
  - [ ] Proxy the request to the AWS endpoint with `subdirectory` path.
  - [ ] Return list of document metadata to frontend.

---

### 3. `POST /search/{topic}`
- ✅ **Purpose**: Search for semantically relevant text chunks using OpenSearch.
- ✅ **Linked Lambda**: `retrieve_handler.py`
- ✅ **Status**: Implemented in AWS
- 🛠️ **To Do**:
  - [ ] Route: `POST /api/search/:topic`
  - [ ] Forward `query` in the request body.
  - [ ] Return search matches with text chunks and metadata.

---

### 4. `POST /delete-file`
- ✅ **Purpose**: Delete all indexed chunks associated with a file.
- ✅ **Linked Lambda**: `delete_handler.py`
- ✅ **Status**: Implemented in AWS
- 🛠️ **To Do**:
  - [ ] Route: `POST /api/delete-file`
  - [ ] Accept payload: `{ "filename": "..." }`
  - [ ] Proxy to AWS and return deletion result.

---

### 5. Document Editing Flow
- **Purpose**: Update document content and trigger reindexing
- **Process**:
  1. Delete existing file from processed/
  2. Upload new content to uploads/
  3. Wait for ingestion
  4. Verify search index update
- **Status**: ✅ Implemented
- **Tasks**:
  - [x] Implement file deletion
  - [x] Implement content upload
  - [x] Add ingestion status tracking
  - [x] Add status polling
  - [ ] Monitor ingestion success rates
  - [ ] Add retry mechanism for failed ingestions
  - [ ] Implement ingestion status tracking
  - [ ] Add timeout handling

### Ingestion Status Tracking
- **Purpose**: Provide visibility into document processing status
- **Implementation**:
  - Check file presence in uploads/ and processed/
  - Status states: pending, processing, complete, error
  - 5-second polling interval
  - 5-minute timeout
  - Visual status indicators
- **Status**: ✅ Implemented
- **Tasks**:
  - [x] Implement status checking
  - [x] Add polling mechanism
  - [x] Add timeout handling
  - [x] Add error handling
  - [ ] Add retry mechanism
  - [ ] Add detailed status messages
  - [ ] Implement status history

### Pagination Support
- **Purpose**: Improve performance and usability with large document sets
- **Implementation**:
  - 10 documents per page
  - Server-side pagination
  - Navigation controls
  - Document count display
- **Status**: ✅ Implemented
- **Tasks**:
  - [x] Implement basic pagination
  - [x] Add navigation controls
  - [x] Add document count
  - [ ] Add custom page size
  - [ ] Add sort persistence
  - [ ] Add filter persistence
  - [ ] Optimize for large datasets

---

## 🟡 S3-Triggered Function (Handled Automatically)

### `ingest_handler.py`
- ✅ **Purpose**: Extract, chunk, embed, and index a file uploaded to S3.
- ✅ **Trigger**: `S3:ObjectCreated:*` event on `uploads/`
- 🛠️ **To Do**:
  - [ ] Backend does **not** need to expose this.
  - [ ] Optional: expose `/api/reprocess-file` that re-uploads the same file to trigger ingestion again (see Bonus section).

---

## 🧩 Optional Backend Enhancements (Bonus)

### 5. `POST /reprocess-file`
- ⏳ **Purpose**: Re-trigger ingestion manually by overwriting the file in S3.
- 🔧 **To Do**:
  - [ ] Route: `POST /api/reprocess-file`
  - [ ] Accept `{ topic, filename }`, re-upload using a PUT to existing S3 key.
  - [ ] This re-triggers ingestion automatically via S3 event.

---

### 6. `GET /index-stats`
- ⏳ **Purpose**: Fetch per-topic document stats and index health.
- 🔧 **To Do**:
  - [ ] Route: `GET /api/index-stats`
  - [ ] Lambda or proxy should query OpenSearch for:
    - Doc count per topic
    - Last ingestion timestamp
    - Index size (optional)

---

### 7. Authentication (Pluggable)
- 🔐 **Purpose**: Secure frontend/backend usage
- 🔧 **To Do**:
  - [ ] Add middleware for token-based or session-based authentication
  - [ ] Protect all backend proxy routes

---

## 🧠 Deployment / Proxy Setup

- [ ] Create Node.js or Python backend (e.g., Express/FastAPI)
- [ ] Secure all routes and allow CORS for the React frontend
- [ ] Use environment variables for:
  - AWS endpoint URLs
  - Access tokens or secrets (if needed)
- [ ] Optional: use API Gateway with usage plans or rate limits

---

## ✅ Summary Table

| Route                    | Lambda Function          | Backend Proxy Route       | Status       |
|-------------------------|--------------------------|---------------------------|--------------|
| `/generate-url`         | generate_presigned_url.py | `/api/generate-url`       | ✅ To proxy  |
| `/items/{subdirectory}` | get_bucket_docs.py        | `/api/items/:subdirectory`| ✅ To proxy  |
| `/search/{topic}`       | retrieve_handler.py       | `/api/search/:topic`      | ✅ To proxy  |
| `/delete-file`          | delete_handler.py         | `/api/delete-file`        | ✅ To proxy  |
| *(S3 upload trigger)*   | ingest_handler.py         | *(auto-triggered)*        | ✅ Done      |
| `/reprocess-file`       | *(reupload logic)*        | `/api/reprocess-file`     | 🔄 Optional  |
| `/index-stats`          | *(custom OpenSearch query)*| `/api/index-stats`        | 🔄 Optional  |
| `Authentication`        | *(none yet)*              | All routes                 | 🔄 Optional  |

---

