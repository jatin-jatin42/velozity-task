import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "../types";

type ActivityFeedProps = {
  items: ActivityItem[];
  title?: string;
  emptyMessage?: string;
};

export const ActivityFeed = ({
  items,
  title = "Live activity",
  emptyMessage = "No activity yet."
}: ActivityFeedProps) => (
  <section className="panel">
    <div className="panel__header">
      <h2>{title}</h2>
    </div>
    <div className="activity-list">
      {items.length === 0 ? <p className="empty-state">{emptyMessage}</p> : null}
      {items.map((item) => (
        <article key={item.id} className="activity-item">
          <p>{item.message}</p>
          <span>
            {item.project.name} • {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </article>
      ))}
    </div>
  </section>
);
