import { UserRole } from "@prisma/client";
import { Router } from "express";
import { adminDashboardController, developerDashboardController, pmDashboardController } from "../controllers/dashboard-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/require-role.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get("/admin", requireRole(UserRole.ADMIN), asyncHandler(adminDashboardController));
dashboardRouter.get("/pm", requireRole(UserRole.PROJECT_MANAGER), asyncHandler(pmDashboardController));
dashboardRouter.get(
  "/developer",
  requireRole(UserRole.DEVELOPER),
  asyncHandler(developerDashboardController)
);
