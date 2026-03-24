import { Router } from "express";
import { loginController, logoutController, meController, refreshController } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { loginSchema } from "../validators/auth-validator.js";
import { validate } from "../middleware/validate.js";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), asyncHandler(loginController));
authRouter.post("/refresh", asyncHandler(refreshController));
authRouter.post("/logout", asyncHandler(logoutController));
authRouter.get("/me", authenticate, asyncHandler(meController));
