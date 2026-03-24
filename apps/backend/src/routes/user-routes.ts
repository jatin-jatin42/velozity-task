import { UserRole } from "@prisma/client";
import { Router } from "express";
import { listUsersController } from "../controllers/user-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { listUsersQuerySchema } from "../validators/user-validator.js";

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get(
  "/",
  requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(listUsersController)
);
