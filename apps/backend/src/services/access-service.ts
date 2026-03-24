import { FeedScopeType, type Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";

export const assertProjectManagementAccess = async (user: AuthUser, projectId: string) => {
  if (user.role === UserRole.ADMIN) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    return project;
  }

  if (user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "You cannot manage this project.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      createdByPmId: user.id
    }
  });

  if (!project) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  return project;
};

export const assertProjectViewAccess = async (user: AuthUser, projectId: string) => {
  if (user.role === UserRole.ADMIN) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    return project;
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    return assertProjectManagementAccess(user, projectId);
  }

  const task = await prisma.task.findFirst({
    where: {
      projectId,
      assignedDeveloperId: user.id
    },
    include: {
      project: true
    }
  });

  if (!task) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  return task.project;
};

export const getProjectWhereForUser = (user: AuthUser): Prisma.ProjectWhereInput => {
  if (user.role === UserRole.ADMIN) {
    return {};
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    return { createdByPmId: user.id };
  }

  return {
    tasks: {
      some: {
        assignedDeveloperId: user.id
      }
    }
  };
};

export const getTaskWhereForUser = (user: AuthUser): Prisma.TaskWhereInput => {
  if (user.role === UserRole.ADMIN) {
    return {};
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    return {
      project: {
        createdByPmId: user.id
      }
    };
  }

  return {
    assignedDeveloperId: user.id
  };
};

export const getActivityWhereForUser = (
  user: AuthUser,
  scope: FeedScopeType,
  projectId?: string
): Prisma.ActivityLogWhereInput => {
  if (scope === FeedScopeType.GLOBAL) {
    if (user.role !== UserRole.ADMIN) {
      throw new ApiError(403, "FORBIDDEN", "Global activity is only available to admins.");
    }

    return {};
  }

  if (scope === FeedScopeType.PROJECT) {
    if (user.role === UserRole.ADMIN) {
      return projectId ? { projectId } : {};
    }

    if (user.role === UserRole.PROJECT_MANAGER) {
      return {
        project: {
          createdByPmId: user.id,
          ...(projectId ? { id: projectId } : {})
        }
      };
    }

    return {
      ...(projectId ? { projectId } : {}),
      task: {
        assignedDeveloperId: user.id
      }
    };
  }

  if (user.role === UserRole.ADMIN) {
    return {};
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    return {
      project: {
        createdByPmId: user.id
      }
    };
  }

  return {
    task: {
      assignedDeveloperId: user.id
    }
  };
};
