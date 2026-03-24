import { Router } from "express";
import { listActivityController } from "../controllers/activity-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { activityQuerySchema } from "../validators/activity-validator.js";

export const activityRouter = Router();

activityRouter.use(authenticate);
activityRouter.get("/", validate({ query: activityQuerySchema }), asyncHandler(listActivityController));
