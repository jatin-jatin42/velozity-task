import { Router } from "express";
import { activityRouter } from "./activity-routes.js";
import { authRouter } from "./auth-routes.js";
import { clientRouter } from "./client-routes.js";
import { dashboardRouter } from "./dashboard-routes.js";
import { notificationRouter } from "./notification-routes.js";
import { projectRouter } from "./project-routes.js";
import { taskRouter } from "./task-routes.js";
import { userRouter } from "./user-routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({
    data: {
      ok: true
    }
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/clients", clientRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/activity", activityRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/dashboard", dashboardRouter);
