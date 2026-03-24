import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error.js";

type SchemaShape = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: AnyZodObject;
};

export const validate =
  (schema: SchemaShape) => (request: Request, _response: Response, next: NextFunction) => {
    const bodyResult = schema.body
      ? schema.body.safeParse(request.body)
      : { success: true as const, data: request.body };
    const queryResult = schema.query
      ? schema.query.safeParse(request.query)
      : { success: true as const, data: request.query };
    const paramsResult = schema.params
      ? schema.params.safeParse(request.params)
      : { success: true as const, data: request.params };

    if (!bodyResult.success) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "Request validation failed.", bodyResult.error.flatten())
      );
    }

    if (!queryResult.success) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "Request validation failed.", queryResult.error.flatten())
      );
    }

    if (!paramsResult.success) {
      return next(
        new ApiError(400, "VALIDATION_ERROR", "Request validation failed.", paramsResult.error.flatten())
      );
    }

    request.body = bodyResult.data;
    request.query = queryResult.data;
    request.params = paramsResult.data;
    next();
  };
