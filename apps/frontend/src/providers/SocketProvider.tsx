import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type PropsWithChildren
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import type { NotificationPayload } from "../types";

type SocketContextValue = {
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(getApiBaseUrl(), {
      auth: {
        token: accessToken
      },
      withCredentials: true
    });

    socket.on("activity:new", () => {
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["project"] });
      void queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
      void queryClient.invalidateQueries({ queryKey: ["task"] });
    });

    socket.on("notification:new", (notification) => {
      queryClient.setQueryData<NotificationPayload | undefined>(["notifications"], (current) => ({
        items: [notification, ...(current?.items ?? [])].slice(0, 20),
        unreadCount: (current?.unreadCount ?? 0) + 1
      }));
    });

    socket.on("notification:count", ({ unreadCount }) => {
      queryClient.setQueryData<NotificationPayload | undefined>(["notifications"], (current) => ({
        items: current?.items ?? [],
        unreadCount
      }));
    });

    socket.on("presence:count", ({ activeUsersOnline }) => {
      queryClient.setQueryData(["dashboard", "ADMIN"], (current: any) =>
        current
          ? {
              ...current,
              activeUsersOnline
            }
          : current
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, queryClient, user]);

  const value = useMemo(
    () => ({
      joinProject: (projectId: string) => {
        socketRef.current?.emit("project:join", projectId);
      },
      leaveProject: (projectId: string) => {
        socketRef.current?.emit("project:leave", projectId);
      }
    }),
    []
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }

  return context;
};
