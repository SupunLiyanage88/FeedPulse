import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  code?: number;
  keyValue?: any;
}

const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue!)[0];
    message = `${field} already exists`;
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;