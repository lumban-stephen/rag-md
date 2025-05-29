# Initial Project Setup Documentation

This document outlines the changes made to set up the RAG Management Dashboard project structure and configuration.

## 1. Project Structure Implementation

### Directory Structure Created
```
project-root/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── common/       # Shared components
│   │   │   ├── layout/       # Layout components
│   │   │   └── features/     # Feature-specific components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service calls
│   │   │   ├── api/         # API client setup
│   │   │   └── aws/         # AWS-specific services
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Global styles
│   │   ├── context/          # React context providers
│   │   └── assets/           # Static assets
│   └── [configuration files]
│
├── server/                    # Backend Express application
│   ├── src/
│   │   ├── routes/           # Route definitions
│   │   │   ├── api/         # API routes
│   │   │   └── aws/         # AWS proxy routes
│   │   ├── services/        # Business logic
│   │   │   ├── aws/        # AWS services
│   │   │   └── rag/        # RAG-specific services
│   │   ├── interfaces/      # TypeScript interfaces
│   │   ├── middlewares/     # Express middleware
│   │   ├── constants/       # Application constants
│   │   └── config/         # Configuration files
│   └── [configuration files]
│
└── shared/                   # Shared code
    ├── types/               # Shared TypeScript types
    └── constants/           # Shared constants
```

## 2. Package Management Changes

### Root package.json Configuration
- Implemented workspace configuration for client, server, and shared directories
- Consolidated all dependencies at the root level
- Simplified scripts to run directly from root
- Fixed ESLint version conflicts (downgraded to v8.56.0 for compatibility)

```json
{
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev:client": "vite",
    "dev:server": "ts-node-dev --respawn --transpile-only server/src/app.ts",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "build:client": "tsc && vite build",
    "build:server": "tsc -p server/tsconfig.json",
    "build": "npm run build:client && npm run build:server",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

### Key Changes
- Removed separate package.json files from client and server
- All dependencies managed at root level
- Simplified script execution
- Direct command execution without cd

## 3. Server Implementation

### Environment Configuration
Created `server/src/config/env.ts` for centralized configuration:
```typescript
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      uploadsPrefix: process.env.AWS_S3_UPLOADS_PREFIX || 'uploads/',
      processedPrefix: process.env.AWS_S3_PROCESSED_PREFIX || 'processed/'
    },
    openSearch: {
      domain: process.env.AWS_OPENSEARCH_DOMAIN,
      index: process.env.AWS_OPENSEARCH_INDEX || 'rag-index'
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
}
```

### AWS S3 Service Implementation
Created `server/src/services/aws/s3.service.ts` with core functionality:
- Generate presigned URLs for uploads
- List documents by topic
- Delete documents
- Error handling and logging

### API Routes Implementation
Created `server/src/routes/aws/s3.routes.ts` with endpoints:
- GET `/api/s3/generate-url` - Generate upload URL
- GET `/api/s3/documents/:topic` - List documents
- DELETE `/api/s3/documents/:topic/:filename` - Delete document

## 4. Key Decisions and Rationale

1. **Workspace Structure**
   - Chose monorepo approach for better code organization
   - Shared dependencies reduce duplication
   - Easier dependency management
   - Better version consistency

2. **Dependency Management**
   - Consolidated dependencies at root level
   - Removed duplicate installations
   - Fixed version conflicts
   - Improved maintainability

3. **TypeScript Configuration**
   - Strict type checking enabled
   - Path aliases for better imports
   - Shared type definitions
   - Consistent configuration across packages

4. **Environment Configuration**
   - Centralized config management
   - Type-safe configuration
   - Environment variable validation
   - Default values for development

## 5. Running the Application

### Prerequisites
1. Node.js (v18 or higher)
2. npm (v8 or higher)
3. AWS credentials configured (for S3 functionality)

### Setup Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment files:
   - Copy `.env.example` to `.env` in the root directory
   - Update AWS credentials and other configuration values

3. Start the development servers:
   ```bash
   # Start both client and server
   npm run dev

   # Or start them separately
   npm run dev:client  # Frontend (Vite)
   npm run dev:server  # Backend (Express)
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Available Scripts
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run preview` - Preview the built client application

## 6. Next Steps

1. **Frontend Setup**
   - Move existing React components to new structure
   - Set up API client services
   - Implement AWS service integration
   - Add TypeScript types

2. **Backend Enhancement**
   - Add OpenSearch service
   - Implement authentication
   - Add request validation
   - Set up logging

3. **Development Environment**
   - Create development environment file
   - Set up testing environment
   - Configure CI/CD pipeline
   - Add documentation

4. **Shared Code**
   - Define shared types
   - Create utility functions
   - Set up constants
   - Add validation schemas 