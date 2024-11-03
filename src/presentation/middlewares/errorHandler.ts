import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  code?: string;
  status?: number;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error details for debugging
  console.error('Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    code: error.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send sanitized error response
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    status: error.status || 500
  });
}; 