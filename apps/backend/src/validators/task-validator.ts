import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const taskIdParamSchema = z.object({
  taskId: z.string().min(1)
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(5).max(1500),
  assignedDeveloperId: z.string().min(1).nullable().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().datetime()
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional()
});
