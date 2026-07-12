export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  readonly statusCode = 400;
  readonly code = "BAD_REQUEST";
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = "VALIDATION_ERROR";
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = "UNAUTHORIZED";

  constructor(message = "Authentication is required") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor(message = "You do not have permission to perform this action") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(resource = "Resource") {
    super(`${resource} not found`);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";
}

export class TooManyRequestsError extends AppError {
  readonly statusCode = 429;
  readonly code = "TOO_MANY_REQUESTS";

  constructor(message = "Too many requests") {
    super(message);
  }
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_SERVER_ERROR";

  constructor(message = "An unexpected error occurred") {
    super(message);
  }
}
