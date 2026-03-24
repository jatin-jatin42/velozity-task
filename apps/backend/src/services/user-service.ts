import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { serializeUser } from "./presenters.js";

export const listUsers = async (user: AuthUser, role?: UserRole) => {
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "You cannot view users.");
  }

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(user.role === UserRole.PROJECT_MANAGER ? { role: UserRole.DEVELOPER } : {})
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  return users.map(serializeUser);
};
