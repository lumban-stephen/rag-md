import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import s3Routes from './routes/aws/s3.routes.js';
import proxyRoutes from './routes/proxy.routes.js';
import logsRoutes from './routes/logs.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/s3', s3Routes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/logs', logsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 