import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export const requireRole =
  (...roles: UserRole[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authUser) {
      return next(new ApiError(401, "UNAUTHORIZED", "Authentication is required."));
    }

    if (!roles.includes(request.authUser.role)) {
      return next(new ApiError(403, "FORBIDDEN", "You are not allowed to access this resource."));
    }

    next();
  };
