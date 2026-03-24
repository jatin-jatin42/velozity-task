import { FeedScopeType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { socketManager } from "../socket/socket-manager.js";
import { getActivityWhereForUser } from "./access-service.js";
import { serializeActivity } from "./presenters.js";

const makeScopeKey = (userId: string, scope: FeedScopeType, projectId?: string) =>
  `${userId}:${scope}:${projectId ?? "all"}`;

export const listActivity = async (
  user: AuthUser,
  input: {
    scope: FeedScopeType;
    projectId?: string;
    missed?: boolean;
  }
) => {
  const where = getActivityWhereForUser(user, input.scope, input.projectId);
  const now = new Date();

  if (input.missed) {
    const cursor = await prisma.feedCursor.findUnique({
      where: {
        scopeKey: makeScopeKey(user.id, input.scope, input.projectId)
      }
    });

    const missedWhere = {
      ...where,
      createdAt: {
        gt: cursor?.lastSeenAt ?? new Date(0)
      }
    };

    const items = await prisma.activityLog.findMany({
      where: missedWhere,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    await prisma.feedCursor.upsert({
      where: {
        scopeKey: makeScopeKey(user.id, input.scope, input.projectId)
      },
      update: {
        lastSeenAt: now
      },
      create: {
        scopeKey: makeScopeKey(user.id, input.scope, input.projectId),
        userId: user.id,
        scopeType: input.scope,
        projectId: input.projectId ?? null,
        lastSeenAt: now
      }
    });

    return items.map(serializeActivity);
  }

  const items = await prisma.activityLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true
        }
      },
      project: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  await prisma.feedCursor.upsert({
    where: {
      scopeKey: makeScopeKey(user.id, input.scope, input.projectId)
    },
    update: {
      lastSeenAt: now
    },
    create: {
      scopeKey: makeScopeKey(user.id, input.scope, input.projectId),
      userId: user.id,
      scopeType: input.scope,
      projectId: input.projectId ?? null,
      lastSeenAt: now
    }
  });

  return items.map(serializeActivity);
};

export const emitActivityEvent = (input: {
  activity: ReturnType<typeof serializeActivity>;
  projectId: string;
  managerId: string;
  developerId?: string | null;
}) => {
  socketManager.emitActivity(input);
};
