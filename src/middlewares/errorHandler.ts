/**
 * Global error handling middleware for Express
 */
import type {NextFunction, Request, Response} from "express";

import type {ApiError} from "../types/index.js";

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorStack = err instanceof Error ? err.stack : undefined;

  console.error("Error:", {
    message: err.message,
    stack: errorStack,
    path: req.path,
    method: req.method,
  });

  const statusCode =
    "statusCode" in err && typeof err.statusCode === "number"
      ? err.statusCode
      : 500;

  const response: ApiError = {
    message: err.message || "Internal server error",
    statusCode,
  };

  // Include error details in development
  if (process.env.NODE_ENV === "development" && errorStack) {
    response.error = errorStack;
  }

  res.status(statusCode).json(response);
}

/**
 * Wrapper for async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
