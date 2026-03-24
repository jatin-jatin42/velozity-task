import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { ActivityFeed } from "../components/ActivityFeed";
import { TaskTable } from "../components/TaskTable";
import { useSocketContext } from "../providers/SocketProvider";
import type { ActivityItem, Project, Task, TaskPriority, TaskStatus, User } from "../types";

const statuses = ["", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const priorities = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const ProjectDetailPage = ({ projectId }: { projectId: string }) => {
  const queryClient = useQueryClient();
  const { joinProject, leaveProject } = useSocketContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedDeveloperId: "",
    status: "TODO" as TaskStatus,
    priority: "MEDIUM" as TaskPriority,
    dueDate: ""
  });

  useEffect(() => {
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [joinProject, leaveProject, projectId]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.toString();
  }, [searchParams]);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiRequest<Project>(`/projects/${projectId}`)
  });

  const usersQuery = useQuery({
    queryKey: ["users", "developers"],
    queryFn: () => apiRequest<User[]>(`/users?role=DEVELOPER`)
  });

  const tasksQuery = useQuery({
    queryKey: ["projectTasks", projectId, queryString],
    queryFn: () =>
      apiRequest<Task[]>(
        `/projects/${projectId}/tasks${queryString ? `?${queryString}` : ""}`
      )
  });

  const activityQuery = useQuery({
    queryKey: ["activity", "PROJECT", projectId],
    queryFn: () => apiRequest<ActivityItem[]>(`/activity?scope=PROJECT&projectId=${projectId}&missed=true`)
  });

  const createTask = useMutation({
    mutationFn: () =>
      apiRequest(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: {
          ...form,
          assignedDeveloperId: form.assignedDeveloperId || null,
          dueDate: new Date(form.dueDate).toISOString()
        }
      }),
    onSuccess: () => {
      setForm({
        title: "",
        description: "",
        assignedDeveloperId: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: ""
      });
      void queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiRequest(`/tasks/${taskId}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    }
  });

  return (
    <div className="page-grid page-grid--split">
      <div className="stack-lg">
        <section className="panel hero-panel">
          <p className="eyebrow">{projectQuery.data?.client.name}</p>
          <h1>{projectQuery.data?.name}</h1>
          <p>{projectQuery.data?.description}</p>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Create task</h2>
          </div>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              createTask.mutate();
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
                Developer
                <select
                  value={form.assignedDeveloperId}
                  onChange={(event) => setForm({ ...form, assignedDeveloperId: event.target.value })}
                >
                  <option value="">Unassigned</option>
                  {usersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
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
                  {priorities.filter(Boolean).map((priority) => (
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
                  {statuses.filter(Boolean).map((status) => (
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
            <button type="submit">Create Task</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Task filters</h2>
          </div>
          <div className="form-grid">
            <label>
              Status
              <select
                value={searchParams.get("status") ?? ""}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  event.target.value ? next.set("status", event.target.value) : next.delete("status");
                  setSearchParams(next);
                }}
              >
                {statuses.map((status) => (
                  <option key={status || "all-status"} value={status}>
                    {status || "All statuses"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={searchParams.get("priority") ?? ""}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  event.target.value ? next.set("priority", event.target.value) : next.delete("priority");
                  setSearchParams(next);
                }}
              >
                {priorities.map((priority) => (
                  <option key={priority || "all-priority"} value={priority}>
                    {priority || "All priorities"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due from
              <input
                type="datetime-local"
                value={searchParams.get("dueFrom")?.slice(0, 16) ?? ""}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  event.target.value
                    ? next.set("dueFrom", new Date(event.target.value).toISOString())
                    : next.delete("dueFrom");
                  setSearchParams(next);
                }}
              />
            </label>
            <label>
              Due to
              <input
                type="datetime-local"
                value={searchParams.get("dueTo")?.slice(0, 16) ?? ""}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  event.target.value
                    ? next.set("dueTo", new Date(event.target.value).toISOString())
                    : next.delete("dueTo");
                  setSearchParams(next);
                }}
              />
            </label>
          </div>
        </section>

        <TaskTable
          tasks={tasksQuery.data ?? []}
          onStatusChange={(taskId, status) => updateStatus.mutate({ taskId, status })}
        />
      </div>
      <ActivityFeed items={activityQuery.data ?? []} emptyMessage="No activity for this project yet." />
    </div>
  );
};
