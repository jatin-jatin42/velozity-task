import { UserRole } from "@prisma/client";
import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional()
});
