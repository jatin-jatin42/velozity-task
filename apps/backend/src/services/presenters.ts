import type {
  ActivityLog,
  Client,
  Notification,
  Project,
  Task,
  User
} from "@prisma/client";
import { ROLE_LABELS } from "../constants/roles.js";
import { toRelativeTime } from "../utils/formatters.js";

type ActivityWithRelations = ActivityLog & {
  actor: Pick<User, "id" | "name" | "role">;
  task: Pick<Task, "id" | "title" | "status" | "priority"> | null;
  project: Pick<Project, "id" | "name">;
};

type TaskWithRelations = Task & {
  assignedDeveloper: Pick<User, "id" | "name" | "email"> | null;
  project: Pick<Project, "id" | "name" | "createdByPmId">;
};

type ProjectWithRelations = Project & {
  client: Client;
  tasks: Pick<Task, "id" | "status" | "priority" | "isOverdue">[];
};

export const serializeUser = (user: Pick<User, "id" | "name" | "email" | "role">) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleLabel: ROLE_LABELS[user.role]
});

export const serializeClient = (client: Client) => client;

export const serializeProject = (project: ProjectWithRelations) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  createdAt: project.createdAt,
  client: serializeClient(project.client),
  taskCounts: {
    total: project.tasks.length,
    overdue: project.tasks.filter((task) => task.isOverdue).length,
    byStatus: project.tasks.reduce<Record<string, number>>((accumulator, task) => {
      accumulator[task.status] = (accumulator[task.status] ?? 0) + 1;
      return accumulator;
    }, {})
  }
});

export const serializeTask = (task: TaskWithRelations) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  isOverdue: task.isOverdue,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  project: task.project,
  assignedDeveloper: task.assignedDeveloper
});

export const serializeActivity = (activity: ActivityWithRelations) => ({
  id: activity.id,
  type: activity.type,
  message: activity.message,
  fromValue: activity.fromValue,
  toValue: activity.toValue,
  createdAt: activity.createdAt,
  relativeTime: toRelativeTime(activity.createdAt),
  actor: {
    id: activity.actor.id,
    name: activity.actor.name,
    role: activity.actor.role
  },
  task: activity.task,
  project: activity.project
});

export const serializeNotification = (notification: Notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  relatedTaskId: notification.relatedTaskId,
  readAt: notification.readAt,
  createdAt: notification.createdAt
});
