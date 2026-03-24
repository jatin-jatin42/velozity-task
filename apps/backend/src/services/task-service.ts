import {
  ActivityType,
  NotificationType,
  TaskPriority,
  TaskStatus,
  UserRole,
  type Prisma
} from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthUser } from "../types/auth.js";
import { ApiError } from "../utils/api-error.js";
import { formatActivityMessage } from "../utils/formatters.js";
import { assertProjectManagementAccess, assertProjectViewAccess, getTaskWhereForUser } from "./access-service.js";
import { emitActivityEvent } from "./activity-service.js";
import { createNotification } from "./notification-service.js";
import { serializeActivity, serializeTask } from "./presenters.js";

const priorityWeight: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

const getTaskDetail = async (taskId: string) =>
  prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignedDeveloper: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

const ensureDeveloper = async (developerId: string | null | undefined) => {
  if (!developerId) {
    return null;
  }

  const developer = await prisma.user.findUnique({
    where: { id: developerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!developer || developer.role !== UserRole.DEVELOPER) {
    throw new ApiError(400, "INVALID_DEVELOPER", "Assigned developer must be a developer.");
  }

  return developer;
};

const createActivityLog = async (input: {
  projectId: string;
  taskId: string;
  actorId: string;
  type: ActivityType;
  fromValue?: string | null;
  toValue?: string | null;
  message: string;
}) =>
  prisma.activityLog.create({
    data: {
      projectId: input.projectId,
      taskId: input.taskId,
      actorId: input.actorId,
      type: input.type,
      fromValue: input.fromValue ?? null,
      toValue: input.toValue ?? null,
      message: input.message
    },
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
    }
  });

const broadcastActivity = (
  activity: Awaited<ReturnType<typeof createActivityLog>>,
  managerId: string,
  developerId?: string | null
) => {
  emitActivityEvent({
    activity: serializeActivity(activity),
    projectId: activity.projectId,
    managerId,
    developerId
  });
};

const notifyAssignment = async (
  actor: AuthUser,
  task: { id: string; title: string; assignedDeveloperId?: string | null },
  developerId?: string | null
) => {
  if (!developerId || developerId === actor.id) {
    return;
  }

  await createNotification({
    userId: developerId,
    type: NotificationType.TASK_ASSIGNED,
    title: "New task assigned",
    body: `${actor.name} assigned you to ${task.title}.`,
    relatedTaskId: task.id
  });
};

const notifyInReview = async (
  actor: AuthUser,
  task: { id: string; title: string; project: { createdByPmId: string } }
) => {
  if (task.project.createdByPmId === actor.id) {
    return;
  }

  await createNotification({
    userId: task.project.createdByPmId,
    type: NotificationType.TASK_IN_REVIEW,
    title: "Task moved to review",
    body: `${task.title} is ready for review.`,
    relatedTaskId: task.id
  });
};

export const listTasksByProject = async (
  user: AuthUser,
  projectId: string,
  filters: { status?: TaskStatus; priority?: TaskPriority; dueFrom?: string; dueTo?: string }
) => {
  await assertProjectViewAccess(user, projectId);

  const where: Prisma.TaskWhereInput = {
    projectId,
    ...getTaskWhereForUser(user),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...((filters.dueFrom || filters.dueTo)
      ? {
          dueDate: {
            ...(filters.dueFrom ? { gte: new Date(filters.dueFrom) } : {}),
            ...(filters.dueTo ? { lte: new Date(filters.dueTo) } : {})
          }
        }
      : {})
  };

  const tasks = await prisma.task.findMany({
    where,
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
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
  });

  return tasks
    .map(serializeTask)
    .sort((left, right) => priorityWeight[right.priority] - priorityWeight[left.priority]);
};

export const getTaskById = async (user: AuthUser, taskId: string) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskWhereForUser(user)
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
    }
  });

  if (!task) {
    throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  const activity = await prisma.activityLog.findMany({
    where: {
      taskId: task.id
    },
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
    }
  });

  return {
    ...serializeTask(task),
    activity: activity.map(serializeActivity)
  };
};

export const createTask = async (
  user: AuthUser,
  projectId: string,
  input: {
    title: string;
    description: string;
    assignedDeveloperId?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }
) => {
  const project = await assertProjectManagementAccess(user, projectId);
  await ensureDeveloper(input.assignedDeveloperId);

  const task = await prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      assignedDeveloperId: input.assignedDeveloperId ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: new Date(input.dueDate),
      createdById: user.id
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
    }
  });

  const activity = await createActivityLog({
    projectId,
    taskId: task.id,
    actorId: user.id,
    type: ActivityType.TASK_CREATED,
    message: `${user.name} created ${task.title}.`
  });

  broadcastActivity(activity, project.createdByPmId, task.assignedDeveloperId);
  await notifyAssignment(user, task, task.assignedDeveloperId);

  return serializeTask(task);
};

export const updateTask = async (
  user: AuthUser,
  taskId: string,
  input: {
    title?: string;
    description?: string;
    assignedDeveloperId?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
  }
) => {
  const existingTask = await getTaskDetail(taskId);

  if (!existingTask) {
    throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  await assertProjectManagementAccess(user, existingTask.projectId);
  await ensureDeveloper(input.assignedDeveloperId);

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.assignedDeveloperId !== undefined
        ? { assignedDeveloperId: input.assignedDeveloperId }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {})
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
    }
  });

  if (
    input.assignedDeveloperId !== undefined &&
    input.assignedDeveloperId !== existingTask.assignedDeveloperId
  ) {
    const activity = await createActivityLog({
      projectId: updatedTask.projectId,
      taskId: updatedTask.id,
      actorId: user.id,
      type: ActivityType.TASK_ASSIGNED,
      fromValue: existingTask.assignedDeveloperId ?? "Unassigned",
      toValue: input.assignedDeveloperId ?? "Unassigned",
      message: `${user.name} reassigned ${updatedTask.title}.`
    });

    broadcastActivity(activity, updatedTask.project.createdByPmId, updatedTask.assignedDeveloperId);
    await notifyAssignment(user, updatedTask, updatedTask.assignedDeveloperId);
  }

  if (input.status && input.status !== existingTask.status) {
    const activity = await createActivityLog({
      projectId: updatedTask.projectId,
      taskId: updatedTask.id,
      actorId: user.id,
      type: ActivityType.TASK_STATUS_CHANGED,
      fromValue: existingTask.status,
      toValue: input.status,
      message: formatActivityMessage(user.name, updatedTask.title, existingTask.status, input.status)
    });

    broadcastActivity(activity, updatedTask.project.createdByPmId, updatedTask.assignedDeveloperId);

    if (input.status === TaskStatus.IN_REVIEW) {
      await notifyInReview(user, updatedTask);
    }
  }

  return serializeTask(updatedTask);
};

export const updateTaskStatus = async (user: AuthUser, taskId: string, status: TaskStatus) => {
  const existingTask = await getTaskDetail(taskId);

  if (!existingTask) {
    throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");
  }

  if (user.role === UserRole.PROJECT_MANAGER) {
    await assertProjectManagementAccess(user, existingTask.projectId);
  }

  if (user.role === UserRole.DEVELOPER && existingTask.assignedDeveloperId !== user.id) {
    throw new ApiError(403, "FORBIDDEN", "You can update only your assigned tasks.");
  }

  if (existingTask.status === status) {
    return serializeTask(existingTask);
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      status
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
    }
  });

  const activity = await createActivityLog({
    projectId: updatedTask.projectId,
    taskId: updatedTask.id,
    actorId: user.id,
    type: ActivityType.TASK_STATUS_CHANGED,
    fromValue: existingTask.status,
    toValue: status,
    message: formatActivityMessage(user.name, updatedTask.title, existingTask.status, status)
  });

  broadcastActivity(activity, updatedTask.project.createdByPmId, updatedTask.assignedDeveloperId);

  if (status === TaskStatus.IN_REVIEW) {
    await notifyInReview(user, updatedTask);
  }

  return serializeTask(updatedTask);
};
