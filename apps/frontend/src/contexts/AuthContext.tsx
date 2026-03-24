import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { rawAuthRequest, registerAuthHandlers, setAccessToken } from "../api/http";
import type { User } from "../types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applySession = (nextToken: string, nextUser: User) => {
    setAccessToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser);
    setStatus("authenticated");
  };

  const clearSession = () => {
    setAccessToken(null);
    setTokenState(null);
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
  };

  const refreshSession = async () => {
    try {
      const result = await rawAuthRequest("/auth/refresh");
      applySession(result.accessToken, result.user);
      return result.accessToken;
    } catch {
      clearSession();
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    const result = await rawAuthRequest("/auth/login", { email, password });
    applySession(result.accessToken, result.user);
  };

  const logout = async () => {
    try {
      await rawAuthRequest("/auth/logout");
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    registerAuthHandlers({
      refresh: refreshSession,
      clear: clearSession
    });

    void refreshSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken: token,
      status,
      login,
      logout
    }),
    [status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
