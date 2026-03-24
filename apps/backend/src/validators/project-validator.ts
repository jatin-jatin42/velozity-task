import { z } from "zod";

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1)
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(5).max(1000),
  clientId: z.string().min(1)
});

export const updateProjectSchema = createProjectSchema.partial();
