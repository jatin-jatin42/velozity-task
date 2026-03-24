import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import type { Client, Project } from "../types";

export const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: ""
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiRequest<Project[]>("/projects")
  });

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiRequest<Client[]>("/clients")
  });

  const createProject = useMutation({
    mutationFn: () => apiRequest<Project>("/projects", { method: "POST", body: form }),
    onSuccess: () => {
      setForm({ name: "", description: "", clientId: "" });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel__header">
          <h2>Create project</h2>
        </div>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            createProject.mutate();
          }}
        >
          <label>
            Project name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label>
            Client
            <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
              <option value="">Select client</option>
              {clientsQuery.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create Project</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel__header">
          <h2>Projects</h2>
        </div>
        <div className="card-grid">
          {projectsQuery.data?.map((project) => (
            <article key={project.id} className="project-card">
              <p className="eyebrow">{project.client.name}</p>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="chip-row">
                <span className="chip">Tasks: {project.taskCounts.total}</span>
                <span className="chip">Overdue: {project.taskCounts.overdue}</span>
              </div>
              <Link to={`/projects/${project.id}`}>Open project</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
