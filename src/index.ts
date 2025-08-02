import express from 'express';
import logger from './logger';

const app = express();
const port = process.env.PORT || 3001;

// Request logging middleware
app.use((req: any, res, next) => {
  req.startTime = Date.now();
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  logger.info('Health check endpoint accessed', { endpoint: '/' });
  res.send('Hello from the backend!');
});

// Response logging middleware
app.use((req: any, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime
    });
    return originalSend.call(this, data);
  };
  next();
});

// Error logging middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404 routes
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  logger.info(`Backend server started successfully`, { 
    port: port,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});