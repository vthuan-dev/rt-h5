// Mock Authentication với LocalStorage - không cần backend
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

type StoredUser = {
  username: string;
  password: string;
  phone: string;
  role: "USER" | "ADMIN";
  balance: number;
  createdAt: string;
};

type WalletTransaction = {
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

type AdminDashboard = {
  pendingWithdraws: number;
  totalUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
};

type AdminAuditLog = {
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

const USERS_KEY = "mock_users";
const SESSIONS_KEY = "mock_sessions";
const TRANSACTIONS_KEY = "mock_wallet_transactions";
const AUDIT_LOGS_KEY = "mock_audit_logs";

// Helper: Lấy danh sách users từ LocalStorage
function getUsers(): Record<string, StoredUser> {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    // Tạo user admin mặc định
    const defaultUsers = {
      admin: {
        username: "admin",
        password: "admin123",
        phone: "0123456789",
        role: "ADMIN" as const,
        balance: 1000000,
        createdAt: new Date().toISOString(),
      },
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(data);
}

// Helper: Lưu users
function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUserId(username: string, users: Record<string, StoredUser>): number {
  return Object.keys(users).indexOf(username) + 1;
}

function getTransactions(): WalletTransaction[] {
  const raw = localStorage.getItem(TRANSACTIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions(rows: WalletTransaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(rows));
}

function getAuditLogs(): AdminAuditLog[] {
  const raw = localStorage.getItem(AUDIT_LOGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAuditLogs(rows: AdminAuditLog[]) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(rows));
}

// Helper: Tạo token giả
function generateToken(username: string): string {
  return `mock_token_${username}_${Date.now()}`;
}

// Helper: Lấy session từ token
function getSession(token: string): { username: string } | null {
  const sessions = localStorage.getItem(SESSIONS_KEY);
  if (!sessions) return null;
  const parsed = JSON.parse(sessions);
  return parsed[token] || null;
}

// Helper: Lưu session
function saveSession(token: string, username: string) {
  const sessions = localStorage.getItem(SESSIONS_KEY);
  const parsed = sessions ? JSON.parse(sessions) : {};
  parsed[token] = { username };
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(parsed));
}

// Helper: Xóa session
function removeSession(token: string) {
  const sessions = localStorage.getItem(SESSIONS_KEY);
  if (!sessions) return;
  const parsed = JSON.parse(sessions);
  delete parsed[token];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(parsed));
}

function requireSession(token: string): { username: string } {
  const session = getSession(token);
  if (!session) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn.");
  }
  return session;
}

function appendAuditLog(
  userId: number | null,
  action: string,
  status: "SUCCESS" | "FAILED",
  detail: string,
) {
  const logs = getAuditLogs();
  const next: AdminAuditLog = {
    id: logs.length + 1,
    userId,
    action,
    status,
    ip: null,
    userAgent: navigator.userAgent ?? null,
    requestId: `req_${Date.now()}`,
    detail,
    createdAt: new Date().toISOString(),
  };
  logs.push(next);
  saveAuditLogs(logs);
}

function requireAdmin(token: string): { username: string; userId: number; users: Record<string, StoredUser> } {
  const session = requireSession(token);
  const users = getUsers();
  const actor = users[session.username];
  if (!actor || actor.role !== "ADMIN") {
    throw new Error("Bạn không có quyền truy cập tính năng admin.");
  }
  return { username: session.username, userId: getUserId(session.username, users), users };
}

// Delay giả để giống API thật
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // Đăng ký user mới
  register: async (payload: {
    username: string;
    password: string;
    phone: string;
  }): Promise<AuthResponse> => {
    await delay(500); // Giả lập network delay

    const users = getUsers();

    // Kiểm tra username đã tồn tại
    if (users[payload.username]) {
      throw new Error("Tên đăng nhập đã tồn tại.");
    }

    // Tạo user mới
    const newUser: StoredUser = {
      username: payload.username,
      password: payload.password,
      phone: payload.phone,
      role: "USER",
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    users[payload.username] = newUser;
    saveUsers(users);

    // Tạo token
    const token = generateToken(payload.username);
    const refreshToken = generateToken(`refresh_${payload.username}`);
    saveSession(token, payload.username);

    return {
      token,
      refreshToken,
      user: {
        id: Object.keys(users).length,
        username: newUser.username,
        phone: newUser.phone,
        role: newUser.role,
        balance: newUser.balance,
        createdAt: newUser.createdAt,
      },
    };
  },

  // Đăng nhập
  login: async (payload: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    await delay(500);

    const users = getUsers();
    const user = users[payload.username];

    // Kiểm tra user tồn tại
    if (!user) {
      throw new Error("Tên đăng nhập không tồn tại.");
    }

    // Kiểm tra password
    if (user.password !== payload.password) {
      throw new Error("Mật khẩu không đúng.");
    }

    // Tạo token
    const token = generateToken(payload.username);
    const refreshToken = generateToken(`refresh_${payload.username}`);
    saveSession(token, payload.username);

    return {
      token,
      refreshToken,
      user: {
        id: getUserId(payload.username, users),
        username: user.username,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    };
  },

  // Lấy thông tin user hiện tại
  me: async (token: string): Promise<AuthUser> => {
    await delay(300);

    const session = requireSession(token);
    const users = getUsers();
    const user = users[session.username];

    if (!user) {
      throw new Error("User không tồn tại.");
    }

    return {
      id: getUserId(session.username, users),
      username: user.username,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
    };
  },

  // Đăng xuất
  logout: async (token: string): Promise<{ message: string }> => {
    await delay(300);
    removeSession(token);
    return { message: "Đăng xuất thành công." };
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    await delay(300);
    
    // Parse username từ refresh token
    const match = refreshToken.match(/mock_token_refresh_(.+)_\d+/);
    if (!match) {
      throw new Error("Refresh token không hợp lệ.");
    }

    const username = match[1];
    const users = getUsers();
    
    if (!users[username]) {
      throw new Error("User không tồn tại.");
    }

    const newToken = generateToken(username);
    const newRefreshToken = generateToken(`refresh_${username}`);
    saveSession(newToken, username);

    return { token: newToken, refreshToken: newRefreshToken };
  },

  // Cập nhật balance (helper cho nạp/rút tiền)
  updateBalance: (username: string, amount: number) => {
    const users = getUsers();
    if (users[username]) {
      users[username].balance = amount;
      saveUsers(users);
    }
  },

  // Lấy balance
  getBalance: (token: string): number => {
    const session = getSession(token);
    if (!session) return 0;
    const users = getUsers();
    return users[session.username]?.balance || 0;
  },
  walletSummary: async (token: string): Promise<{ id: number; username: string; balance: number }> => {
    await delay(200);
    const session = requireSession(token);
    const users = getUsers();
    const user = users[session.username];
    if (!user) throw new Error("User không tồn tại.");
    return { id: getUserId(session.username, users), username: user.username, balance: user.balance };
  },
  deposit: async (
    token: string,
    payload: { amount: number; paymentMethod: string; idempotencyKey: string; note?: string },
  ): Promise<{ message: string; balance: number; transaction: WalletTransaction }> => {
    await delay(400);
    if (!payload.amount || payload.amount <= 0) {
      throw new Error("Số tiền nạp không hợp lệ.");
    }

    const session = requireSession(token);
    const users = getUsers();
    const user = users[session.username];
    if (!user) throw new Error("User không tồn tại.");

    const rows = getTransactions();
    const tx: WalletTransaction = {
      id: rows.length + 1,
      userId: getUserId(session.username, users),
      type: "DEPOSIT",
      amount: payload.amount,
      status: "PENDING",
      paymentMethod: payload.paymentMethod,
      bankName: null,
      bankAccount: null,
      accountHolder: null,
      note: payload.note ?? null,
      createdAt: new Date().toISOString(),
    };
    rows.push(tx);
    saveTransactions(rows);
    appendAuditLog(
      tx.userId,
      "WALLET_DEPOSIT_REQUEST",
      "SUCCESS",
      `Yêu cầu nạp ${payload.amount.toLocaleString("vi-VN")}đ`,
    );

    return {
      message: "Đã gửi yêu cầu nạp tiền, vui lòng chờ admin duyệt.",
      balance: user.balance,
      transaction: tx,
    };
  },
  withdraw: async (
    token: string,
    payload: {
      amount: number;
      idempotencyKey: string;
      bankName: string;
      bankAccount: string;
      accountHolder: string;
      note?: string;
    },
  ): Promise<{ message: string; balance: number; transaction: WalletTransaction }> => {
    await delay(400);
    if (!payload.amount || payload.amount <= 0) {
      throw new Error("Số tiền rút không hợp lệ.");
    }

    const session = requireSession(token);
    const users = getUsers();
    const user = users[session.username];
    if (!user) throw new Error("User không tồn tại.");
    if (payload.amount > user.balance) {
      throw new Error("Số dư không đủ để rút.");
    }

    user.balance -= payload.amount;
    saveUsers(users);

    const rows = getTransactions();
    const tx: WalletTransaction = {
      id: rows.length + 1,
      userId: getUserId(session.username, users),
      type: "WITHDRAW",
      amount: payload.amount,
      status: "PENDING",
      paymentMethod: null,
      bankName: payload.bankName,
      bankAccount: payload.bankAccount,
      accountHolder: payload.accountHolder,
      note: payload.note ?? null,
      createdAt: new Date().toISOString(),
    };
    rows.push(tx);
    saveTransactions(rows);
    appendAuditLog(tx.userId, "WALLET_WITHDRAW_REQUEST", "SUCCESS", `Yêu cầu rút ${payload.amount.toLocaleString("vi-VN")}đ`);

    return {
      message: "Đã gửi yêu cầu rút tiền, vui lòng chờ duyệt.",
      balance: user.balance,
      transaction: tx,
    };
  },
  walletTransactions: async (token: string): Promise<WalletTransaction[]> => {
    await delay(250);
    const session = requireSession(token);
    const users = getUsers();
    const userId = getUserId(session.username, users);
    return getTransactions()
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  adminDashboard: async (token: string): Promise<AdminDashboard> => {
    await delay(250);
    const { users } = requireAdmin(token);
    const txs = getTransactions();
    return {
      pendingWithdraws: txs.filter((x) => x.type === "WITHDRAW" && x.status === "PENDING").length,
      totalUsers: Object.keys(users).length,
      totalDeposits: txs.filter((x) => x.type === "DEPOSIT" && x.status === "SUCCESS").reduce((sum, x) => sum + x.amount, 0),
      totalWithdraws: txs.filter((x) => x.type === "WITHDRAW" && x.status === "SUCCESS").reduce((sum, x) => sum + x.amount, 0),
    };
  },
  adminPendingWithdraws: async (token: string): Promise<WalletTransaction[]> => {
    await delay(250);
    requireAdmin(token);
    return getTransactions().filter((x) => x.type === "WITHDRAW" && x.status === "PENDING");
  },
  adminWithdraws: async (
    token: string,
    params?: { status?: "PENDING" | "SUCCESS" | "FAILED"; limit?: number; cursor?: number },
  ): Promise<WalletTransaction[]> => {
    await delay(250);
    requireAdmin(token);
    let rows = getTransactions().filter((x) => x.type === "WITHDRAW");
    if (params?.status) rows = rows.filter((x) => x.status === params.status);
    rows = rows.sort((a, b) => b.id - a.id);
    if (params?.cursor) rows = rows.filter((x) => x.id < params.cursor);
    if (params?.limit) rows = rows.slice(0, params.limit);
    return rows;
  },
  adminReviewWithdraw: async (
    token: string,
    id: number,
    payload: { status: "SUCCESS" | "FAILED"; note?: string },
  ): Promise<{ message: string; transaction: WalletTransaction }> => {
    await delay(300);
    const { userId: adminId, users } = requireAdmin(token);
    const rows = getTransactions();
    const target = rows.find((tx) => tx.id === id && tx.type === "WITHDRAW");
    if (!target) throw new Error("Không tìm thấy giao dịch rút tiền.");
    if (target.status !== "PENDING") throw new Error("Giao dịch này đã được duyệt trước đó.");

    target.status = payload.status;
    target.note = payload.note ?? target.note;
    saveTransactions(rows);

    if (payload.status === "FAILED") {
      const username = Object.keys(users)[target.userId - 1];
      if (username && users[username]) {
        users[username].balance += target.amount;
        saveUsers(users);
      }
    }

    appendAuditLog(adminId, "ADMIN_REVIEW_WITHDRAW", "SUCCESS", `Duyệt giao dịch #${id}: ${payload.status}`);
    return {
      message: payload.status === "SUCCESS" ? "Đã duyệt rút tiền thành công." : "Đã từ chối yêu cầu rút tiền.",
      transaction: target,
    };
  },
  adminUsers: async (token: string, keyword?: string): Promise<AuthUser[]> => {
    await delay(250);
    const { users } = requireAdmin(token);
    const q = keyword?.trim().toLowerCase();
    return Object.values(users)
      .map((u) => ({
        id: getUserId(u.username, users),
        username: u.username,
        phone: u.phone,
        role: u.role,
        balance: u.balance,
        createdAt: u.createdAt,
      }))
      .filter((u) => !q || u.username.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q));
  },
  adminTransactions: async (
    token: string,
    params?: { keyword?: string; type?: "DEPOSIT" | "WITHDRAW"; status?: "PENDING" | "SUCCESS" | "FAILED" },
  ): Promise<WalletTransaction[]> => {
    await delay(250);
    requireAdmin(token);
    let rows = [...getTransactions()];
    if (params?.type) rows = rows.filter((x) => x.type === params.type);
    if (params?.status) rows = rows.filter((x) => x.status === params.status);
    if (params?.keyword?.trim()) {
      const q = params.keyword.trim().toLowerCase();
      rows = rows.filter((x) =>
        [x.bankName, x.bankAccount, x.accountHolder, x.note]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows.sort((a, b) => b.id - a.id);
  },
  adminAuditLogs: async (token: string, action?: string): Promise<AdminAuditLog[]> => {
    await delay(250);
    requireAdmin(token);
    const q = action?.trim().toLowerCase();
    const rows = getAuditLogs().sort((a, b) => b.id - a.id);
    return !q ? rows : rows.filter((x) => x.action.toLowerCase().includes(q));
  },
};
