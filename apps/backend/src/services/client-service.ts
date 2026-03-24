import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { serializeClient } from "./presenters.js";

export const listClients = async (user: AuthUser) => {
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "You cannot view clients.");
  }

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" }
  });

  return clients.map(serializeClient);
};

export const createClient = async (
  user: AuthUser,
  input: { name: string; email?: string; company?: string; phone?: string }
) => {
  if (user.role !== UserRole.ADMIN) {
    throw new ApiError(403, "FORBIDDEN", "Only admins can create clients.");
  }

  const client = await prisma.client.create({
    data: {
      name: input.name,
      email: input.email || null,
      company: input.company || null,
      phone: input.phone || null
    }
  });

  return serializeClient(client);
};
