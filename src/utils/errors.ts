/**
 * Domain error hierarchy. Each error carries an HTTP status so the central
 * error-handling middleware can translate it into a response without a big
 * switch statement.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
}

export class InsufficientStockError extends ConflictError {
  readonly sku: string;

  constructor(sku: string, requested: number, available: number) {
    super(
      `Insufficient stock for SKU ${sku}: requested ${requested}, available ${available}`
    );
    this.sku = sku;
  }
}
