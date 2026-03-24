import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const authenticate = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const token = header.replace("Bearer ", "");
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "User account was not found.");
    }

    request.authUser = user;
    next();
  } catch (error) {
    next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token.", error));
  }
};
