import { mockApi } from "./mockAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message ?? "Yêu cầu thất bại.");
  }
  return data as T;
}

export type AuthUser = {
  id: number;
  username: string;
  phone: string;
  role: "USER" | "ADMIN";
  balance: number;
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type WalletTransaction = {
  id: number;
  userId: number;
  type: "DEPOSIT" | "WITHDRAW";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  paymentMethod: string | null;
  bankName: string | null;
  bankAccount: string | null;
  accountHolder: string | null;
  note: string | null;
  createdAt: string;
};

export type WalletSummary = {
  id: number;
  username: string;
  balance: number;
};

export type AdminDashboard = {
  pendingWithdraws: number;
  totalUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
};

export type AdminReviewPayload = {
  status: "SUCCESS" | "FAILED";
  note?: string;
};

export type AdminAuditLog = {
  id: number;
  userId: number | null;
  action: string;
  status: "SUCCESS" | "FAILED";
  ip: string | null;
  userAgent: string | null;
  requestId: string;
  detail: string | null;
  createdAt: string;
};

export const api = {
  register: (payload: { username: string; password: string; phone: string }) =>
    USE_MOCK 
      ? mockApi.register(payload)
      : request<AuthResponse>("/api/auth/register", { method: "POST", body: payload }),
  login: (payload: { username: string; password: string }) =>
    USE_MOCK
      ? mockApi.login(payload)
      : request<AuthResponse>("/api/auth/login", { method: "POST", body: payload }),
  refresh: (refreshToken: string) =>
    USE_MOCK
      ? mockApi.refresh(refreshToken)
      : request<{ token: string; refreshToken: string }>("/api/auth/refresh", {
          method: "POST",
          body: { refreshToken },
        }),
  logout: (token: string, refreshToken: string) =>
    USE_MOCK
      ? mockApi.logout(token)
      : request<{ message: string }>("/api/auth/logout", {
          method: "POST",
          token,
          body: { refreshToken },
        }),
  me: (token: string) => 
    USE_MOCK
      ? mockApi.me(token)
      : request<AuthUser>("/api/auth/me", { token }),
  walletSummary: (token: string) =>
    request<WalletSummary>("/api/wallet/summary", { token }),
  deposit: (
    token: string,
    payload: { amount: number; paymentMethod: string; idempotencyKey: string; note?: string },
  ) =>
    request<{ message: string; balance: number; transaction: WalletTransaction }>("/api/wallet/deposit", {
      method: "POST",
      token,
      body: payload,
    }),
  withdraw: (
    token: string,
    payload: {
      amount: number;
      idempotencyKey: string;
      bankName: string;
      bankAccount: string;
      accountHolder: string;
      note?: string;
    },
  ) =>
    request<{ message: string; balance: number; transaction: WalletTransaction }>("/api/wallet/withdraw", {
      method: "POST",
      token,
      body: payload,
    }),
  walletTransactions: (token: string) =>
    request<WalletTransaction[]>("/api/wallet/transactions", { token }),
  adminDashboard: (token: string) =>
    request<AdminDashboard>("/api/admin/dashboard", { token }),
  adminPendingWithdraws: (token: string) =>
    request<WalletTransaction[]>("/api/admin/withdraws/pending", { token }),
  adminWithdraws: (
    token: string,
    params?: { status?: "PENDING" | "SUCCESS" | "FAILED"; limit?: number; cursor?: number },
  ) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.cursor) search.set("cursor", String(params.cursor));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<WalletTransaction[]>(`/api/admin/withdraws${suffix}`, { token });
  },
  adminReviewWithdraw: (token: string, id: number, payload: AdminReviewPayload) =>
    request<{ message: string; transaction: WalletTransaction }>(`/api/admin/withdraws/${id}/review`, {
      method: "POST",
      token,
      body: payload,
    }),
  adminUsers: (token: string, keyword?: string) => {
    const suffix = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    return request<AuthUser[]>(`/api/admin/users${suffix}`, { token });
  },
  adminTransactions: (
    token: string,
    params?: { keyword?: string; type?: "DEPOSIT" | "WITHDRAW"; status?: "PENDING" | "SUCCESS" | "FAILED" },
  ) => {
    const search = new URLSearchParams();
    if (params?.keyword) search.set("keyword", params.keyword);
    if (params?.type) search.set("type", params.type);
    if (params?.status) search.set("status", params.status);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<WalletTransaction[]>(`/api/admin/transactions${suffix}`, { token });
  },
  adminAuditLogs: (token: string, action?: string) => {
    const suffix = action ? `?action=${encodeURIComponent(action)}` : "";
    return request<AdminAuditLog[]>(`/api/admin/audit-logs${suffix}`, { token });
  },
};
