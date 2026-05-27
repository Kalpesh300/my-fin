import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

import { AppError } from "./errors.js";

const corsMiddleware: RequestHandler = (request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,x-user-id");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
};

const userMiddleware: RequestHandler = (request, _response, next) => {
  const userIdHeader = request.header("x-user-id");

  if (!userIdHeader?.trim()) {
    next(new AppError("x-user-id header is required.", 401));
    return;
  }

  next();
};

const getUserId = (request: Request) => {
  const userIdHeader = request.header("x-user-id");

  if (!userIdHeader?.trim()) {
    throw new AppError("x-user-id header is required.", 401);
  }

  return userIdHeader.trim();
};

const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.body = result.data;
    next();
  };

const validateParams =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (request, _response, next) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    request.params = result.data as Request["params"];
    next();
  };

const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation failed.",
      issues: error.issues.map((issue) => issue.message),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Unexpected server error." });
};

export {
  asyncHandler,
  corsMiddleware,
  errorHandler,
  getUserId,
  userMiddleware,
  validateBody,
  validateParams,
};
