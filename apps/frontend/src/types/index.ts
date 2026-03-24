export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
};

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  client: Client;
  taskCounts: {
    total: number;
    overdue: number;
    byStatus: Record<string, number>;
  };
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    createdByPmId: string;
  };
  assignedDeveloper: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ActivityItem = {
  id: string;
  type: string;
  message: string;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  relativeTime: string;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  } | null;
  project: {
    id: string;
    name: string;
  };
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedTaskId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationPayload = {
  items: NotificationItem[];
  unreadCount: number;
};

export type AdminDashboard = {
  totalProjects: number;
  totalTasksByStatus: Record<TaskStatus, number>;
  overdueTaskCount: number;
  activeUsersOnline: number;
};

export type PmDashboard = {
  projects: { id: string; name: string }[];
  projectCount: number;
  tasksByPriority: Record<TaskPriority, number>;
  upcomingDueDates: Task[];
};

export type DeveloperDashboard = {
  assignedTasks: Task[];
};

export type TaskDetail = Task & {
  activity: ActivityItem[];
};
