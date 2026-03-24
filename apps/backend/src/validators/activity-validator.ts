import { FeedScopeType } from "@prisma/client";
import { z } from "zod";

export const activityQuerySchema = z.object({
  scope: z.nativeEnum(FeedScopeType),
  projectId: z.string().optional(),
  missed: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => value === true || value === "true")
});
