# Architecture Overview

## 🏗️ Architecture

### Frontend
- **React with TypeScript**
  - Functional components with hooks
  - Type-safe props and state
  - Context API for global state
- **Vite for build tooling**
  - Fast development server
  - Optimized production builds
- **Tailwind CSS for styling**
  - Responsive design
  - Custom component library
  - Dark mode support
- **React Query for data fetching**
  - Automatic caching
  - Real-time updates
  - Error handling
- **React Hot Toast for notifications**
  - Customizable notifications
  - Success/error states
  - Auto-dismissal

### Backend
- **Node.js with Express**
  - RESTful API endpoints
  - Middleware support
  - Error handling
- **TypeScript for type safety**
  - Interface definitions
  - Type checking
  - API type generation
- **AWS SDK integration**
  - S3 document operations
  - OpenSearch queries
  - Lambda invocations
- **CORS and security middleware**
  - Request validation
  - Rate limiting
  - Authentication

### AWS Services
- **S3 for document storage**
  - Document upload/download
  - Presigned URLs
  - Bucket organization
- **OpenSearch for semantic search**
  - Vector embeddings
  - Full-text search
  - Relevance scoring
- **Lambda functions for processing**
  - Document ingestion
  - Text extraction
  - Index updates
- **API Gateway for endpoints**
  - REST API
  - Request validation
  - Rate limiting

### Project Structure
```
rag-md/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── features/ # Feature-specific components
│   │   │   ├── layout/   # Layout components
│   │   │   └── ui/       # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
├── server/                # Backend application
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   │   ├── aws/      # AWS service integrations
│   │   │   └── logging/  # Logging services
│   │   ├── config/       # Configuration
│   │   └── types/        # TypeScript types
│   └── logs/             # Application logs
│
└── shared/               # Shared code
    ├── types/            # Shared TypeScript types
    └── constants/        # Shared constants
``` 