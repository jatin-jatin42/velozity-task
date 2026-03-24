import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/http";
import type { NotificationPayload } from "../types";

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<NotificationPayload>("/notifications")
  });

  const markOne = useMutation({
    mutationFn: (id: string) => apiRequest("/notifications/" + id + "/read", { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAll = useMutation({
    mutationFn: () => apiRequest("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <div className="notification-bell">
      <button type="button" className="ghost-button" onClick={() => setOpen((current) => !current)}>
        Notifications
        <span className="notification-count">{data?.unreadCount ?? 0}</span>
      </button>
      {open ? (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <strong>Notifications</strong>
            <button type="button" className="link-button" onClick={() => markAll.mutate()}>
              Mark all read
            </button>
          </div>
          {data?.items?.length ? (
            data.items.map((item) => (
              <article key={item.id} className={`notification-item ${item.readAt ? "" : "is-unread"}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <div className="notification-item__actions">
                  {item.relatedTaskId ? <Link to={`/tasks/${item.relatedTaskId}`}>Open</Link> : null}
                  {!item.readAt ? (
                    <button type="button" className="link-button" onClick={() => markOne.mutate(item.id)}>
                      Read
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">No notifications yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};
