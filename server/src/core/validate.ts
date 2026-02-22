import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ValidationError } from "../errors/AppError.js";

function isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject<z.ZodRawShape> {
  return schema instanceof z.ZodObject;
}

function ensureStrict<T extends z.ZodTypeAny>(schema: T): T {
  if (isZodObject(schema)) {
    return (schema as z.ZodObject<z.ZodRawShape>).strict() as unknown as T;
  }
  return schema;
}

function formatZodIssues(error: z.ZodError): Record<string, unknown> {
  return {
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  };
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  const strictSchema = ensureStrict(schema);
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      request.body = strictSchema.parse(request.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid request body", formatZodIssues(error));
      }
      throw error;
    }
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  const strictSchema = ensureStrict(schema);
  return async (request: FastifyRequest) => {
    try {
      request.params = strictSchema.parse(request.params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid request params", formatZodIssues(error));
      }
      throw error;
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  const strictSchema = ensureStrict(schema);
  return async (request: FastifyRequest) => {
    try {
      request.query = strictSchema.parse(request.query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid query parameters", formatZodIssues(error));
      }
      throw error;
    }
  };
}
