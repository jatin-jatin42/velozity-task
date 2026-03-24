import { UserRole } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { assertProjectManagementAccess, assertProjectViewAccess, getProjectWhereForUser } from "./access-service.js";
import { serializeProject } from "./presenters.js";

export const listProjects = async (user: AuthUser) => {
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "You cannot view projects.");
  }

  const projects = await prisma.project.findMany({
    where: getProjectWhereForUser(user),
    include: {
      client: true,
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          isOverdue: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return projects.map(serializeProject);
};

export const createProject = async (
  user: AuthUser,
  input: { name: string; description: string; clientId: string }
) => {
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
    throw new ApiError(403, "FORBIDDEN", "You cannot create projects.");
  }

  const client = await prisma.client.findUnique({
    where: { id: input.clientId }
  });

  if (!client) {
    throw new ApiError(404, "CLIENT_NOT_FOUND", "Client not found.");
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId,
      createdByPmId: user.id
    },
    include: {
      client: true,
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          isOverdue: true
        }
      }
    }
  });

  return serializeProject(project);
};

export const getProjectById = async (user: AuthUser, projectId: string) => {
  await assertProjectViewAccess(user, projectId);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          isOverdue: true
        }
      }
    }
  });

  if (!project) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
  }

  return serializeProject(project);
};

export const updateProject = async (
  user: AuthUser,
  projectId: string,
  input: {
    name?: string;
    description?: string;
    clientId?: string;
  }
) => {
  await assertProjectManagementAccess(user, projectId);

  if (input.clientId) {
    const client = await prisma.client.findUnique({
      where: {
        id: input.clientId
      }
    });

    if (!client) {
      throw new ApiError(404, "CLIENT_NOT_FOUND", "Client not found.");
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: input,
    include: {
      client: true,
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
          isOverdue: true
        }
      }
    }
  });

  return serializeProject(project);
};
