import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

interface CustomHttpError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent double responses
  if (res.headersSent) {
    return next(err);
  }

  const errorObj = err instanceof Error ? err : new Error(String(err));
  console.error(`[Error] ${req.method} ${req.url}:`, errorObj.message);

  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, err.errors[0]?.message || 'Validation error', 400, details);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]) : [];
        sendError(
          res,
          `A record with this ${target.length ? target.join(', ') : 'unique field'} already exists`,
          409
        );
        return;
      }
      case 'P2025':
        sendError(res, 'Record not found or access denied', 404);
        return;
      case 'P2003':
        sendError(res, 'Related record was not found or is in use', 400);
        return;
      default:
        sendError(res, `Database operation failed: ${err.message}`, 400);
        return;
    }
  }

  const httpErr = err as CustomHttpError;
  const statusCode = (typeof httpErr?.status === 'number' && httpErr.status)
    || (typeof httpErr?.statusCode === 'number' && httpErr.statusCode)
    || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected server error occurred'
    : errorObj.message || 'Internal server error';

  sendError(res, message, statusCode);
}
