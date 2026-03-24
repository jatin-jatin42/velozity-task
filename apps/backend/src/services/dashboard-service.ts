import { TaskPriority, TaskStatus, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { socketManager } from "../socket/socket-manager.js";
import { getProjectWhereForUser, getTaskWhereForUser } from "./access-service.js";
import { serializeTask } from "./presenters.js";

const priorityWeight: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

const statusCountObject = () => ({
  TODO: 0,
  IN_PROGRESS: 0,
  IN_REVIEW: 0,
  DONE: 0
});

export const getAdminDashboard = async (user: AuthUser) => {
  if (user.role !== UserRole.ADMIN) {
    throw new ApiError(403, "FORBIDDEN", "Only admins can access this dashboard.");
  }

  const [projectCount, tasks, overdueCount] = await Promise.all([
    prisma.project.count(),
    prisma.task.findMany({
      select: {
        status: true
      }
    }),
    prisma.task.count({
      where: { isOverdue: true }
    })
  ]);

  const tasksByStatus = tasks.reduce<Record<TaskStatus, number>>((accumulator, task) => {
    accumulator[task.status] = (accumulator[task.status] ?? 0) + 1;
    return accumulator;
  }, statusCountObject());

  return {
    totalProjects: projectCount,
    totalTasksByStatus: tasksByStatus,
    overdueTaskCount: overdueCount,
    activeUsersOnline: socketManager.getActiveUserCount()
  };
};

export const getPmDashboard = async (user: AuthUser) => {
  if (user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "Only project managers can access this dashboard.");
  }

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const [projects, tasks, upcomingTasks] = await Promise.all([
    prisma.project.findMany({
      where: getProjectWhereForUser(user),
      select: {
        id: true,
        name: true
      }
    }),
    prisma.task.findMany({
      where: getTaskWhereForUser(user),
      select: {
        priority: true
      }
    }),
    prisma.task.findMany({
      where: {
        ...getTaskWhereForUser(user),
        dueDate: {
          gte: now,
          lte: weekEnd
        },
        status: {
          not: TaskStatus.DONE
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            createdByPmId: true
          }
        },
        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dueDate: "asc"
      },
      take: 10
    })
  ]);

  const tasksByPriority = tasks.reduce<Record<TaskPriority, number>>(
    (accumulator, task) => {
      accumulator[task.priority] = (accumulator[task.priority] ?? 0) + 1;
      return accumulator;
    },
    {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    }
  );

  return {
    projects,
    projectCount: projects.length,
    tasksByPriority,
    upcomingDueDates: upcomingTasks.map(serializeTask)
  };
};

export const getDeveloperDashboard = async (user: AuthUser) => {
  if (user.role !== UserRole.DEVELOPER) {
    throw new ApiError(403, "FORBIDDEN", "Only developers can access this dashboard.");
  }

  const tasks = await prisma.task.findMany({
    where: getTaskWhereForUser(user),
    include: {
      project: {
        select: {
          id: true,
          name: true,
          createdByPmId: true
        }
      },
      assignedDeveloper: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return {
    assignedTasks: tasks
      .map(serializeTask)
      .sort((left, right) => {
        const priorityDelta = priorityWeight[right.priority] - priorityWeight[left.priority];

        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      })
  };
};
