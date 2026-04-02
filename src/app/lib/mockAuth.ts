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

const USERS_KEY = "mock_users";
const SESSIONS_KEY = "mock_sessions";

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
        id: Object.keys(users).indexOf(payload.username) + 1,
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

    const session = getSession(token);
    if (!session) {
      throw new Error("Token không hợp lệ hoặc đã hết hạn.");
    }

    const users = getUsers();
    const user = users[session.username];

    if (!user) {
      throw new Error("User không tồn tại.");
    }

    return {
      id: Object.keys(users).indexOf(session.username) + 1,
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
};
