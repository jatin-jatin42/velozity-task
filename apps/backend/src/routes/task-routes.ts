import { Router } from "express";
import { getTaskController, updateTaskController, updateTaskStatusController } from "../controllers/task-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { taskIdParamSchema, updateTaskSchema, updateTaskStatusSchema } from "../validators/task-validator.js";

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.get("/:taskId", validate({ params: taskIdParamSchema }), asyncHandler(getTaskController));
taskRouter.patch(
  "/:taskId",
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  asyncHandler(updateTaskController)
);
taskRouter.patch(
  "/:taskId/status",
  validate({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
  asyncHandler(updateTaskStatusController)
);
