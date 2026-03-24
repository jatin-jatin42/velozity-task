import type { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { socketManager } from "../socket/socket-manager.js";
import { serializeNotification } from "./presenters.js";

export const listNotifications = async (user: AuthUser) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      readAt: null
    }
  });

  return {
    items: notifications.map(serializeNotification),
    unreadCount
  };
};

export const markNotificationRead = async (user: AuthUser, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: user.id
    }
  });

  if (!notification) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      readAt: notification.readAt ?? new Date()
    }
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null }
  });

  socketManager.emitNotificationCount(user.id, unreadCount);

  return { unreadCount };
};

export const markAllNotificationsRead = async (user: AuthUser) => {
  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  socketManager.emitNotificationCount(user.id, 0);

  return { unreadCount: 0 };
};

export const createNotification = async (input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedTaskId?: string | null;
}) => {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedTaskId: input.relatedTaskId ?? null
    }
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: input.userId,
      readAt: null
    }
  });

  socketManager.emitNotification(input.userId, serializeNotification(notification), unreadCount);
  return notification;
};
