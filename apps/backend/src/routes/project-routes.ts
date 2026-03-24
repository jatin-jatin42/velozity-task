import { UserRole } from "@prisma/client";
import { Router } from "express";
import { createProjectController, getProjectController, listProjectsController, updateProjectController } from "../controllers/project-controller.js";
import { createTaskController, listProjectTasksController } from "../controllers/task-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createProjectSchema, projectIdParamSchema, updateProjectSchema } from "../validators/project-validator.js";
import { createTaskSchema, taskFilterSchema } from "../validators/task-validator.js";

export const projectRouter = Router();

projectRouter.use(authenticate);
projectRouter.get("/", requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER), asyncHandler(listProjectsController));
projectRouter.post(
  "/",
  requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validate({ body: createProjectSchema }),
  asyncHandler(createProjectController)
);
projectRouter.get(
  "/:projectId",
  validate({ params: projectIdParamSchema }),
  asyncHandler(getProjectController)
);
projectRouter.patch(
  "/:projectId",
  requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  asyncHandler(updateProjectController)
);
projectRouter.get(
  "/:projectId/tasks",
  validate({ params: projectIdParamSchema, query: taskFilterSchema }),
  asyncHandler(listProjectTasksController)
);
projectRouter.post(
  "/:projectId/tasks",
  requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validate({ params: projectIdParamSchema, body: createTaskSchema }),
  asyncHandler(createTaskController)
);
