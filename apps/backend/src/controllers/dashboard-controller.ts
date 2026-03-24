import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { getAdminDashboard, getDeveloperDashboard, getPmDashboard } from "../services/dashboard-service.js";

export const adminDashboardController = async (request: Request, response: Response) => {
  const dashboard = await getAdminDashboard(request.authUser!);
  return response.json(success(dashboard));
};

export const pmDashboardController = async (request: Request, response: Response) => {
  const dashboard = await getPmDashboard(request.authUser!);
  return response.json(success(dashboard));
};

export const developerDashboardController = async (request: Request, response: Response) => {
  const dashboard = await getDeveloperDashboard(request.authUser!);
  return response.json(success(dashboard));
};
