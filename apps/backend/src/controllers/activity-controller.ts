import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { listActivity } from "../services/activity-service.js";

export const listActivityController = async (request: Request, response: Response) => {
  const activity = await listActivity(request.authUser!, request.query as never);
  return response.json(success(activity));
};
