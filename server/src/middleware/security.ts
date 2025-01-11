import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.'
});

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Reset'],
  credentials: true,
  maxAge: 600
};

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Security middleware setup
export const setupSecurity = (app: any) => {
  // Basic security headers
  app.use(helmet());
  
  // CORS protection
  app.use(cors(corsOptions));
  
  // Rate limiting
  app.use('/api/', rateLimiter);
  
  // Prevent parameter pollution
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
      }
    }
    next();
  });
  
  // Validate content size
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-length'] && 
        Number(req.headers['content-length']) > 1000000) {
      return res.status(413).json({ error: 'Payload Too Large' });
    }
    next();
  });
  
  // Sanitize request data
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      // Remove any potentially dangerous properties
      delete req.body.constructor;
      delete req.body.prototype;
      delete req.body.__proto__;
    }
    next();
  });
}; 