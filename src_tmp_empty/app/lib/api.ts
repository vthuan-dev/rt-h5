export type AuthUser = {
  id: number;
  username: string;
  phone: string;
  role: "USER";
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

type StoredUser = {
  id: number;
  username: string;
  phone: string;
  password: string;
  role: "USER";
  balance: number;
  createdAt: string;
  updatedAt: string;
};

type StoredSession = {
  token: string;
  refreshToken: string;
  userId: number;
};

const USERS_KEY = "rt_users_json";
const TX_KEY = "rt_transactions_json";
const SESSION_KEY = "rt_session_json";

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const now = () => new Date().toISOString();
const newToken = () => crypto.randomUUID();

const sanitizeUser = (u: StoredUser): AuthUser => ({
  id: u.id,
  username: u.username,
  phone: u.phone,
  role: "USER",
  balance: u.balance,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const requireSession = () => {
  const session = readJson<StoredSession | null>(SESSION_KEY, null);
  if (!session) throw new Error("Phiên đăng nhập đã hết hạn.");
  return session;
};

const findUserByToken = (token?: string | null): StoredUser => {
  if (!token) throw new Error("Vui lòng đăng nhập.");
  const session = requireSession();
  if (session.token !== token) throw new Error("Token không hợp lệ.");
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  const user = users.find((u) => u.id === session.userId);
  if (!user) throw new Error("Không tìm thấy người dùng.");
  return user;
};

const updateUser = (id: number, updater: (user: StoredUser) => StoredUser): StoredUser => {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) throw new Error("Không tìm thấy người dùng.");
  const next = updater(users[index]);
  users[index] = next;
  writeJson(USERS_KEY, users);
  return next;
};

export const api = {
  async register(payload: { username: string; password: string; phone: string }): Promise<AuthResponse> {
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    const username = payload.username.trim();
    const phone = payload.phone.trim();

    if (users.some((u) => u.username === username || u.phone === phone)) {
      throw new Error("Tên đăng nhập hoặc số điện thoại đã tồn tại.");
    }

    const createdAt = now();
    const user: StoredUser = {
      id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      username,
      phone,
      password: payload.password,
      role: "USER",
      balance: 0,
      createdAt,
      updatedAt: createdAt,
    };
    users.push(user);
    writeJson(USERS_KEY, users);

    const session: StoredSession = {
      token: newToken(),
      refreshToken: newToken(),
      userId: user.id,
    };
    writeJson(SESSION_KEY, session);

    return { token: session.token, refreshToken: session.refreshToken, user: sanitizeUser(user) };
  },

  async login(payload: { username: string; password: string }): Promise<AuthResponse> {
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    const user = users.find((u) => u.username === payload.username.trim());
    if (!user || user.password !== payload.password) {
      throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
    }

    const session: StoredSession = {
      token: newToken(),
      refreshToken: newToken(),
      userId: user.id,
    };
    writeJson(SESSION_KEY, session);

    return { token: session.token, refreshToken: session.refreshToken, user: sanitizeUser(user) };
  },

  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const session = requireSession();
    if (session.refreshToken !== refreshToken) {
      throw new Error("Refresh token không hợp lệ.");
    }
    const next = { ...session, token: newToken(), refreshToken: newToken() };
    writeJson(SESSION_KEY, next);
    return { token: next.token, refreshToken: next.refreshToken };
  },

  async logout(token: string, refreshToken: string): Promise<{ message: string }> {
    const session = requireSession();
    if (session.token === token && session.refreshToken === refreshToken) {
      localStorage.removeItem(SESSION_KEY);
    }
    return { message: "Đăng xuất thành công." };
  },

  async me(token: string): Promise<AuthUser> {
    return sanitizeUser(findUserByToken(token));
  },

  async walletSummary(token: string): Promise<WalletSummary> {
    const user = findUserByToken(token);
    return { id: user.id, username: user.username, balance: user.balance };
  },

  deposit: (
    token: string,
    payload: { amount: number; paymentMethod: string; idempotencyKey: string; note?: string },
  ) => {
    const user = findUserByToken(token);
    const nextUser = updateUser(user.id, (u) => ({
      ...u,
      balance: u.balance + payload.amount,
      updatedAt: now(),
    }));

    const txs = readJson<WalletTransaction[]>(TX_KEY, []);
    const tx: WalletTransaction = {
      id: txs.length ? Math.max(...txs.map((t) => t.id)) + 1 : 1,
      userId: user.id,
      type: "DEPOSIT",
      amount: payload.amount,
      status: "SUCCESS",
      paymentMethod: payload.paymentMethod,
      bankName: null,
      bankAccount: null,
      accountHolder: null,
      note: payload.note ?? null,
      createdAt: now(),
    };
    txs.push(tx);
    writeJson(TX_KEY, txs);

    return Promise.resolve({
      message: "Nạp tiền thành công.",
      balance: nextUser.balance,
      transaction: tx,
    });
  },

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
  ) => {
    const user = findUserByToken(token);
    if (user.balance < payload.amount) {
      return Promise.reject(new Error("Số dư không đủ để rút tiền."));
    }

    const nextUser = updateUser(user.id, (u) => ({
      ...u,
      balance: u.balance - payload.amount,
      updatedAt: now(),
    }));

    const txs = readJson<WalletTransaction[]>(TX_KEY, []);
    const tx: WalletTransaction = {
      id: txs.length ? Math.max(...txs.map((t) => t.id)) + 1 : 1,
      userId: user.id,
      type: "WITHDRAW",
      amount: payload.amount,
      status: "PENDING",
      paymentMethod: null,
      bankName: payload.bankName,
      bankAccount: payload.bankAccount,
      accountHolder: payload.accountHolder,
      note: payload.note ?? null,
      createdAt: now(),
    };
    txs.push(tx);
    writeJson(TX_KEY, txs);

    return Promise.resolve({
      message: "Đã gửi yêu cầu rút tiền.",
      balance: nextUser.balance,
      transaction: tx,
    });
  },

  walletTransactions: (token: string) => {
    const user = findUserByToken(token);
    const txs = readJson<WalletTransaction[]>(TX_KEY, []);
    return Promise.resolve(
      txs
        .filter((t) => t.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );
  },
};
