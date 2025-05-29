# Full-Stack TypeScript Project Structure Guide

This document outlines the recommended project structure for full-stack TypeScript applications, combining React frontend and Express backend best practices.

## Project Structure

```
project-root/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── common/       # Shared components (buttons, inputs, etc.)
│   │   │   ├── layout/       # Layout components (header, sidebar, etc.)
│   │   │   └── features/     # Feature-specific components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service calls
│   │   │   ├── api/         # API client setup
│   │   │   └── aws/         # AWS-specific services
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Global styles and Tailwind config
│   │   ├── context/          # React context providers
│   │   ├── assets/           # Static assets
│   │   └── App.tsx           # Main application component
│   ├── public/               # Public static files
│   ├── index.html           # Entry HTML file
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript configuration
│   ├── tailwind.config.js   # Tailwind configuration
│   └── postcss.config.js    # PostCSS configuration
│
├── server/                    # Backend Express application
│   ├── src/
│   │   ├── routes/           # Route definitions and controllers
│   │   │   ├── api/         # API routes
│   │   │   └── aws/         # AWS proxy routes
│   │   ├── services/        # Business logic layer
│   │   │   ├── aws/        # AWS service integrations
│   │   │   └── rag/        # RAG-specific services
│   │   ├── interfaces/      # TypeScript interfaces and types
│   │   ├── middlewares/     # Express middleware functions
│   │   │   ├── auth/       # Authentication middleware
│   │   │   └── error/      # Error handling middleware
│   │   ├── constants/       # Application constants
│   │   ├── config/         # Configuration files
│   │   │   ├── aws.ts      # AWS configuration
│   │   │   └── env.ts      # Environment configuration
│   │   └── app.ts          # Application entry point
│   ├── logs/               # Application logs
│   ├── tests/              # Backend tests
│   └── tsconfig.json       # TypeScript configuration
│
├── shared/                   # Shared code between frontend and backend
│   ├── types/               # Shared TypeScript types
│   └── constants/           # Shared constants
│
├── package.json             # Root package.json for workspace
├── package-lock.json        # Locked dependencies
├── tsconfig.json           # Root TypeScript configuration
├── .gitignore              # Git ignore rules
├── .npmrc                  # NPM configuration
├── .prettierrc             # Prettier code formatter config
└── .editorconfig           # Editor configuration
```

## Directory Structure Details

### 1. Frontend (`client/`)

#### Components (`src/components/`)
- Organized by feature and reusability
- Common components for shared UI elements
- Layout components for page structure
- Feature-specific components

#### Pages (`src/pages/`)
- Page-level components
- Route definitions
- Page-specific layouts

#### Services (`src/services/`)
- API client setup
- AWS service integrations
- Data fetching and caching logic

#### Hooks (`src/hooks/`)
- Custom React hooks
- Shared state management
- API integration hooks

### 2. Backend (`server/`)

#### Routes (`src/routes/`)
- API endpoint definitions
- AWS proxy routes
- Input validation
- Response formatting

#### Services (`src/services/`)
- Business logic implementation
- AWS service integrations
- RAG pipeline management
- Data processing

#### Middlewares (`src/middlewares/`)
- Authentication/Authorization
- Error handling
- Request logging
- CORS configuration
- Request validation

#### Configuration (`src/config/`)
- Environment-specific settings
- AWS credentials and endpoints
- Application constants
- Feature flags

### 3. Shared Code (`shared/`)

- Common TypeScript types
- Shared constants
- Utility functions
- API interfaces

## Best Practices

1. **Type Safety**
   - Use TypeScript interfaces for all data structures
   - Implement strict type checking
   - Share types between frontend and backend

2. **Code Organization**
   - Follow single responsibility principle
   - Keep files focused and small
   - Use meaningful file and directory names

3. **Error Handling**
   - Implement global error handling
   - Use custom error classes
   - Standardize error responses

4. **Security**
   - Keep sensitive data in environment variables
   - Implement proper authentication
   - Use security middleware
   - Secure AWS credentials

5. **Testing**
   - Write unit tests for services
   - Integration tests for routes
   - E2E tests for critical flows
   - Use test environment configurations

6. **Documentation**
   - Document API endpoints
   - Add JSDoc comments
   - Keep README up to date
   - Document AWS integration

7. **Logging**
   - Implement structured logging
   - Log important events and errors
   - Use appropriate log levels

## Getting Started

1. Clone the template repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables for both frontend and backend
4. Start development servers:
   ```bash
   # Start backend
   npm run dev:server
   
   # Start frontend
   npm run dev:client
   ```

## Development Workflow

1. Create new features in feature branches
2. Follow the established directory structure
3. Write tests for new functionality
4. Submit pull requests for review
5. Merge after approval

## Deployment

1. Build both applications:
   ```bash
   npm run build
   ```
2. Set up production environment variables
3. Deploy backend to your server
4. Deploy frontend to your hosting service

## Maintenance

1. Regular dependency updates
2. Security patches
3. Performance monitoring
4. Log rotation
5. Backup strategies

This structure provides a solid foundation for building scalable and maintainable full-stack TypeScript applications. Adjust the structure based on specific project requirements while maintaining the core principles of organization and separation of concerns. 