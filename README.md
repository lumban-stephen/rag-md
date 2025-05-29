# RAG Management App

A modern web application for managing Retrieval-Augmented Generation (RAG) pipelines, providing a user-friendly interface for document management, semantic search, and system monitoring.

## 🌟 Features

### Document Management
- **Upload Documents**: Drag-and-drop interface for uploading PDF, TXT, and MD files
- **Topic Organization**: Organize documents by topics for better management
- **Document Preview**: View and edit document contents directly in the app
- **Bulk Operations**: Support for bulk document deletion and management

### Search & Retrieval
- **Semantic Search**: Natural language queries powered by OpenSearch
- **Topic Filtering**: Filter search results by specific topics
- **Confidence Scoring**: View match confidence for search results
- **Chunk Preview**: Preview matching text chunks with source attribution

### System Monitoring
- **Real-time Logs**: View system events and operations in real-time
- **Ingestion Status**: Track document processing status
- **System Health**: Monitor S3, OpenSearch, and Lambda function status
- **Index Management**: Refresh and manage OpenSearch indices

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- AWS Account with configured services
- Environment variables set up

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd rag-md
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables:
   ```bash
   # In client directory
   cp .env.example .env.local
   # Edit .env.local with your AWS configuration

   # In server directory
   cp .env.example .env
   # Edit .env with your AWS configuration
   ```

4. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Architecture

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for data fetching
- React Hot Toast for notifications

### Backend
- Node.js with Express
- TypeScript for type safety
- AWS SDK integration
- CORS and security middleware

### AWS Services
- S3 for document storage
- OpenSearch for semantic search
- Lambda functions for processing
- API Gateway for endpoints

## 🔧 Development

### Available Scripts

```bash
# Frontend (client directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
npm run test         # Run tests

# Backend (server directory)
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run test         # Run tests
```

### Project Structure
```
rag-md/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
│
├── server/                 # Backend application
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── config/        # Configuration
│   │   └── types/         # TypeScript types
│   └── logs/              # Application logs
│
└── shared/                 # Shared code
    ├── types/             # Shared TypeScript types
    └── constants/         # Shared constants
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📫 Support

For support, please open an issue in the GitHub repository or contact the maintainers. 