import { api } from "@/lib/api";
import type { User } from "@/types";

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),

  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => api.post<LoginResponse>("/auth/register", data).then((r) => r.data),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<LoginResponse>("/auth/refresh").then((r) => r.data),

  getMe: () => api.get<User>("/users/me").then((r) => r.data),
};
