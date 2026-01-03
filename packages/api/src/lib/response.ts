/**
 * HTTP Response Helpers
 *
 * Standardized response format for Cloud Run services.
 */

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  messageAr?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  messageAr?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) response.message = message;
  if (messageAr) response.messageAr = messageAr;

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  messageAr?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
  };

  if (messageAr) response.messageAr = messageAr;

  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  }
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination,
  };

  return res.status(200).json(response);
};

// Common error responses
export const badRequest = (res: Response, message: string, messageAr?: string) =>
  sendError(res, message, 400, messageAr);

export const unauthorized = (res: Response, message = 'Unauthorized', messageAr = 'غير مصرح') =>
  sendError(res, message, 401, messageAr);

export const forbidden = (res: Response, message = 'Forbidden', messageAr = 'محظور') =>
  sendError(res, message, 403, messageAr);

export const notFound = (res: Response, message = 'Not found', messageAr = 'غير موجود') =>
  sendError(res, message, 404, messageAr);

export const conflict = (res: Response, message: string, messageAr?: string) =>
  sendError(res, message, 409, messageAr);

export const serverError = (res: Response, message = 'Internal server error', messageAr = 'خطأ في الخادم') =>
  sendError(res, message, 500, messageAr);
