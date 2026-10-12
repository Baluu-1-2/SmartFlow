import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: Record<string, any>
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  });
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details && { details }),
  });
}
