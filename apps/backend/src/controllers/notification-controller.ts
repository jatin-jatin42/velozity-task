import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notification-service.js";

export const listNotificationsController = async (request: Request, response: Response) => {
  const notifications = await listNotifications(request.authUser!);
  return response.json(success(notifications));
};

export const markNotificationReadController = async (request: Request, response: Response) => {
  const result = await markNotificationRead(request.authUser!, String(request.params.id));
  return response.json(success(result));
};

export const markAllNotificationsReadController = async (request: Request, response: Response) => {
  const result = await markAllNotificationsRead(request.authUser!);
  return response.json(success(result));
};
