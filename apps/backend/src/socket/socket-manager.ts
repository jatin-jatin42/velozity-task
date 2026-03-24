import type { Server as HttpServer } from "node:http";
import { UserRole } from "@prisma/client";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { verifyAccessToken } from "../utils/tokens.js";

class SocketManager {
  private io?: Server;
  private activeUsers = new Map<string, Set<string>>();

  initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: env.CLIENT_ORIGIN,
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token as string | undefined;

        if (!token) {
          return next(new Error("Unauthorized"));
        }

        const payload = verifyAccessToken(token);
        socket.data.user = {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role
        } satisfies AuthUser;

        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    this.io.on("connection", (socket) => {
      const user = socket.data.user as AuthUser;
      this.trackConnection(user.id, socket.id);
      socket.join(this.userRoom(user.id));

      if (user.role === UserRole.ADMIN) {
        socket.join(this.adminRoom());
      }

      socket.on("project:join", async (projectId: string) => {
        if (user.role === UserRole.DEVELOPER) {
          return;
        }

        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            ...(user.role === UserRole.ADMIN ? {} : { createdByPmId: user.id })
          }
        });

        if (!project) {
          return;
        }

        socket.join(this.projectRoom(projectId));
      });

      socket.on("project:leave", (projectId: string) => {
        socket.leave(this.projectRoom(projectId));
      });

      socket.on("disconnect", () => {
        this.trackDisconnect(user.id, socket.id);
      });

      this.broadcastPresence();
    });
  }

  getActiveUserCount() {
    return this.activeUsers.size;
  }

  emitActivity(input: {
    activity: unknown;
    projectId: string;
    managerId: string;
    developerId?: string | null;
  }) {
    if (!this.io) {
      return;
    }

    let chain = this.io
      .to(this.adminRoom())
      .to(this.projectRoom(input.projectId))
      .to(this.userRoom(input.managerId));

    if (input.developerId) {
      chain = chain.to(this.userRoom(input.developerId));
    }

    chain.emit("activity:new", input.activity);
  }

  emitNotification(userId: string, notification: unknown, unreadCount: number) {
    if (!this.io) {
      return;
    }

    this.io.to(this.userRoom(userId)).emit("notification:new", notification);
    this.emitNotificationCount(userId, unreadCount);
  }

  emitNotificationCount(userId: string, unreadCount: number) {
    if (!this.io) {
      return;
    }

    this.io.to(this.userRoom(userId)).emit("notification:count", { unreadCount });
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private projectRoom(projectId: string) {
    return `project:${projectId}`;
  }

  private adminRoom() {
    return "admin:global";
  }

  private trackConnection(userId: string, socketId: string) {
    const sockets = this.activeUsers.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.activeUsers.set(userId, sockets);
  }

  private trackDisconnect(userId: string, socketId: string) {
    const sockets = this.activeUsers.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.activeUsers.delete(userId);
    }

    this.broadcastPresence();
  }

  private broadcastPresence() {
    if (!this.io) {
      return;
    }

    this.io.to(this.adminRoom()).emit("presence:count", {
      activeUsersOnline: this.getActiveUserCount()
    });
  }
}

export const socketManager = new SocketManager();
