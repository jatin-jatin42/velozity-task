import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { TaskTable } from "../components/TaskTable";
import type { DeveloperDashboard, TaskStatus } from "../types";

export const MyTasksPage = () => {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "DEVELOPER"],
    queryFn: () => apiRequest<DeveloperDashboard>("/dashboard/developer")
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiRequest(`/tasks/${taskId}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "DEVELOPER"] });
      void queryClient.invalidateQueries({ queryKey: ["task"] });
    }
  });

  return (
    <TaskTable
      tasks={dashboardQuery.data?.assignedTasks ?? []}
      showProject
      onStatusChange={(taskId, status) => updateStatus.mutate({ taskId, status })}
      emptyMessage="No tasks assigned to you."
    />
  );
};
