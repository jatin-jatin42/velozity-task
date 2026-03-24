import { UserRole } from "@prisma/client";
import { Router } from "express";
import { createClientController, listClientsController } from "../controllers/client-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createClientSchema } from "../validators/client-validator.js";

export const clientRouter = Router();

clientRouter.use(authenticate);
clientRouter.get("/", requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER), asyncHandler(listClientsController));
clientRouter.post(
  "/",
  requireRole(UserRole.ADMIN),
  validate({ body: createClientSchema }),
  asyncHandler(createClientController)
);
