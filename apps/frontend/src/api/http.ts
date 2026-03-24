import type { User } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let clearHandler: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const registerAuthHandlers = (handlers: {
  refresh: () => Promise<string | null>;
  clear: () => void;
}) => {
  refreshHandler = handlers.refresh;
  clearHandler = handlers.clear;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export const rawAuthRequest = async (path: string, body?: unknown) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      json?.error?.message ?? "Request failed.",
      response.status,
      json?.error?.code
    );
  }

  return json?.data as { accessToken: string; user: User };
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.auth === false || !accessToken
        ? {}
        : {
            Authorization: `Bearer ${accessToken}`
          })
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 401 && options.auth !== false && options.retryOnUnauthorized !== false && refreshHandler) {
    const refreshedToken = await refreshHandler();

    if (refreshedToken) {
      return apiRequest<T>(path, {
        ...options,
        retryOnUnauthorized: false
      });
    }

    clearHandler?.();
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      json?.error?.message ?? "Request failed.",
      response.status,
      json?.error?.code
    );
  }

  return json.data as T;
};

export const getApiBaseUrl = () => API_BASE_URL;
