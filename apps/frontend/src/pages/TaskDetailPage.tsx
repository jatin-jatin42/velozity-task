import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { ActivityFeed } from "../components/ActivityFeed";
import { useAuth } from "../contexts/AuthContext";
import type { TaskDetail, TaskPriority, TaskStatus, User } from "../types";

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const TaskDetailPage = ({ taskId }: { taskId: string }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiRequest<TaskDetail>(`/tasks/${taskId}`)
  });

  const usersQuery = useQuery({
    queryKey: ["users", "developers"],
    enabled: user?.role !== "DEVELOPER",
    queryFn: () => apiRequest<User[]>(`/users?role=DEVELOPER`)
  });

  const initialForm = useMemo(
    () => ({
      title: taskQuery.data?.title ?? "",
      description: taskQuery.data?.description ?? "",
      assignedDeveloperId: taskQuery.data?.assignedDeveloper?.id ?? "",
      status: taskQuery.data?.status ?? "TODO",
      priority: taskQuery.data?.priority ?? "MEDIUM",
      dueDate: taskQuery.data?.dueDate?.slice(0, 16) ?? ""
    }),
    [taskQuery.data]
  );

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const refreshFromTask = () => {
    setForm({
      title: taskQuery.data?.title ?? "",
      description: taskQuery.data?.description ?? "",
      assignedDeveloperId: taskQuery.data?.assignedDeveloper?.id ?? "",
      status: taskQuery.data?.status ?? "TODO",
      priority: taskQuery.data?.priority ?? "MEDIUM",
      dueDate: taskQuery.data?.dueDate?.slice(0, 16) ?? ""
    });
  };

  const updateTask = useMutation({
    mutationFn: () =>
      apiRequest(`/tasks/${taskId}`, {
        method: "PATCH",
        body: {
          ...form,
          assignedDeveloperId: form.assignedDeveloperId || null,
          dueDate: new Date(form.dueDate).toISOString()
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: (status: TaskStatus) =>
      apiRequest(`/tasks/${taskId}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (taskQuery.isLoading) {
    return <p>Loading task...</p>;
  }

  return (
    <div className="page-grid page-grid--split">
      <div className="stack-lg">
        <section className="panel hero-panel">
          <p className="eyebrow">{taskQuery.data?.project.name}</p>
          <h1>{taskQuery.data?.title}</h1>
          <p>{taskQuery.data?.description}</p>
          <div className="chip-row">
            <span className="chip">Priority: {taskQuery.data?.priority}</span>
            <span className="chip">Status: {taskQuery.data?.status}</span>
            {taskQuery.data?.isOverdue ? <span className="chip chip--warning">Overdue</span> : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Update status</h2>
          </div>
          <div className="chip-row">
            {statusOptions.map((status) => (
              <button key={status} type="button" className="ghost-button" onClick={() => updateStatus.mutate(status)}>
                {status}
              </button>
            ))}
          </div>
        </section>

        {user?.role !== "DEVELOPER" ? (
          <section className="panel">
            <div className="panel__header">
              <h2>Edit task</h2>
            </div>
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                updateTask.mutate();
              }}
            >
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>
              <div className="form-grid">
                <label>
                  Assigned developer
                  <select
                    value={form.assignedDeveloperId}
                    onChange={(event) => setForm({ ...form, assignedDeveloperId: event.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {usersQuery.data?.map((developer) => (
                      <option key={developer.id} value={developer.id}>
                        {developer.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Due date
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="chip-row">
                <button type="submit">Save Task</button>
                <button type="button" className="ghost-button" onClick={refreshFromTask}>
                  Reset
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
      <ActivityFeed items={taskQuery.data?.activity ?? []} title="Task activity" />
    </div>
  );
};
