import { Router } from "express";
import { listNotificationsController, markAllNotificationsReadController, markNotificationReadController } from "../controllers/notification-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", asyncHandler(listNotificationsController));
notificationRouter.patch("/:id/read", asyncHandler(markNotificationReadController));
notificationRouter.patch("/read-all", asyncHandler(markAllNotificationsReadController));
