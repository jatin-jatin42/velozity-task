import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { ActivityFeed } from "../components/ActivityFeed";
import { StatCard } from "../components/StatCard";
import { TaskTable } from "../components/TaskTable";
import { useAuth } from "../contexts/AuthContext";
import type { ActivityItem, AdminDashboard, DeveloperDashboard, PmDashboard, TaskStatus } from "../types";

const roleEndpoint = {
  ADMIN: "/dashboard/admin",
  PROJECT_MANAGER: "/dashboard/pm",
  DEVELOPER: "/dashboard/developer"
};

const roleScope = {
  ADMIN: "GLOBAL",
  PROJECT_MANAGER: "PROJECT",
  DEVELOPER: "DEVELOPER"
} as const;

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.role],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) {
        return null;
      }

      return apiRequest<AdminDashboard | PmDashboard | DeveloperDashboard>(roleEndpoint[user.role]);
    }
  });

  const activityQuery = useQuery({
    queryKey: ["activity", roleScope[user?.role ?? "DEVELOPER"], "dashboard"],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) {
        return [] as ActivityItem[];
      }

      return apiRequest<ActivityItem[]>(
        `/activity?scope=${roleScope[user.role]}&missed=true`
      );
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiRequest(`/tasks/${taskId}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["task"] });
    }
  });

  if (!user) {
    return null;
  }

  if (dashboardQuery.isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (user.role === "ADMIN" && dashboardQuery.data) {
    const dashboard = dashboardQuery.data as AdminDashboard;
    return (
      <div className="page-grid">
        <section className="stats-grid">
          <StatCard title="Total Projects" value={dashboard.totalProjects} tone="accent" />
          <StatCard title="Overdue Tasks" value={dashboard.overdueTaskCount} tone="warning" />
          <StatCard title="Users Online" value={dashboard.activeUsersOnline} />
          <StatCard title="In Review" value={dashboard.totalTasksByStatus.IN_REVIEW} />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h2>Task status overview</h2>
          </div>
          <div className="chip-row">
            {Object.entries(dashboard.totalTasksByStatus).map(([key, value]) => (
              <span key={key} className="chip">
                {key}: {value}
              </span>
            ))}
          </div>
        </section>
        <ActivityFeed items={activityQuery.data ?? []} />
      </div>
    );
  }

  if (user.role === "PROJECT_MANAGER" && dashboardQuery.data) {
    const dashboard = dashboardQuery.data as PmDashboard;
    return (
      <div className="page-grid">
        <section className="stats-grid">
          <StatCard title="Projects Owned" value={dashboard.projectCount} tone="accent" />
          <StatCard title="Critical Tasks" value={dashboard.tasksByPriority.CRITICAL} tone="warning" />
          <StatCard title="High Priority" value={dashboard.tasksByPriority.HIGH} />
          <StatCard title="Due This Week" value={dashboard.upcomingDueDates.length} />
        </section>
        <TaskTable tasks={dashboard.upcomingDueDates} showProject onStatusChange={(taskId, status) => statusMutation.mutate({ taskId, status })} />
        <ActivityFeed items={activityQuery.data ?? []} title="Team activity" />
      </div>
    );
  }

  const dashboard = dashboardQuery.data as DeveloperDashboard | undefined;
  return (
    <div className="page-grid">
      <section className="stats-grid">
        <StatCard title="Assigned Tasks" value={dashboard?.assignedTasks.length ?? 0} tone="accent" />
        <StatCard
          title="Critical Tasks"
          value={dashboard?.assignedTasks.filter((task) => task.priority === "CRITICAL").length ?? 0}
          tone="warning"
        />
        <StatCard
          title="In Review"
          value={dashboard?.assignedTasks.filter((task) => task.status === "IN_REVIEW").length ?? 0}
        />
      </section>
      <TaskTable
        tasks={dashboard?.assignedTasks ?? []}
        showProject
        onStatusChange={(taskId, status) => statusMutation.mutate({ taskId, status })}
      />
      <ActivityFeed items={activityQuery.data ?? []} title="My activity stream" />
    </div>
  );
};
