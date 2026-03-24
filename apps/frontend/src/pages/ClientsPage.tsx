import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import type { Client } from "../types";

export const ClientsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiRequest<Client[]>("/clients")
  });

  const createClient = useMutation({
    mutationFn: () => apiRequest<Client>("/clients", { method: "POST", body: form }),
    onSuccess: () => {
      setForm({ name: "", email: "", company: "", phone: "" });
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    }
  });

  return (
    <div className="page-grid">
      {user?.role === "ADMIN" ? (
        <section className="panel">
          <div className="panel__header">
            <h2>Create client</h2>
          </div>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              createClient.mutate();
            }}
          >
            <label>
              Client name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Company
              <input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <button type="submit">Create Client</button>
          </form>
        </section>
      ) : null}
      <section className="panel">
        <div className="panel__header">
          <h2>Clients</h2>
        </div>
        <div className="card-grid">
          {clientsQuery.data?.map((client) => (
            <article key={client.id} className="project-card">
              <h3>{client.name}</h3>
              <p>{client.company || "Independent client"}</p>
              <span>{client.email || "No email"}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
