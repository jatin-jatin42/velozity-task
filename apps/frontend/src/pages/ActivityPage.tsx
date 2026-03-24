import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/http";
import { ActivityFeed } from "../components/ActivityFeed";
import { useAuth } from "../contexts/AuthContext";
import type { ActivityItem } from "../types";

const scopeByRole = {
  ADMIN: "GLOBAL",
  PROJECT_MANAGER: "PROJECT",
  DEVELOPER: "DEVELOPER"
} as const;

export const ActivityPage = () => {
  const { user } = useAuth();

  const activityQuery = useQuery({
    queryKey: ["activity", scopeByRole[user?.role ?? "DEVELOPER"], "page"],
    enabled: Boolean(user),
    queryFn: () =>
      apiRequest<ActivityItem[]>(`/activity?scope=${scopeByRole[user!.role]}&missed=true`)
  });

  return <ActivityFeed items={activityQuery.data ?? []} title="Activity feed" />;
};
