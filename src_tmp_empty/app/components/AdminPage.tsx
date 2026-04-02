import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  api,
  type AdminAuditLog,
  type AdminDashboard,
  type AuthUser,
  type WalletTransaction,
} from "../lib/api";

type AdminPageProps = {
  token: string;
};

const adminTabs = [
  { key: "dashboard", label: "Tổng quan" },
  { key: "withdraw", label: "Duyệt rút tiền" },
  { key: "users", label: "Người dùng" },
  { key: "transactions", label: "Giao dịch" },
  { key: "audit", label: "Audit Log" },
] as const;

type AdminTabKey = (typeof adminTabs)[number]["key"];

const statusClassName = (status: "PENDING" | "SUCCESS" | "FAILED") => {
  if (status === "SUCCESS") return "bg-green-100 text-green-700";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};

const statusLabel = (status: "PENDING" | "SUCCESS" | "FAILED") => {
  if (status === "SUCCESS") return "Thành công";
  if (status === "FAILED") return "Thất bại";
  return "Đang chờ";
};

export function AdminPage({ token }: AdminPageProps) {
  const [tab, setTab] = useState<AdminTabKey>("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [pendingWithdraws, setPendingWithdraws] = useState<WalletTransaction[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<WalletTransaction[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [userKeyword, setUserKeyword] = useState("");
  const [txKeyword, setTxKeyword] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");

  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});

  const maxRecentWithdraws = withdrawHistory.slice(0, 50);
  const maxTransactions = transactions.slice(0, 100);
  const maxUsers = users.slice(0, 100);
  const maxAuditLogs = auditLogs.slice(0, 100);

  const withLoader = async (job: () => Promise<void>) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await job();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    const data = await api.adminDashboard(token);
    setDashboard(data);
  };

  const loadWithdraws = async () => {
    const [pending, history] = await Promise.all([
      api.adminPendingWithdraws(token),
      api.adminWithdraws(token, { limit: 100 }),
    ]);
    setPendingWithdraws(pending);
    setWithdrawHistory(history);
  };

  const loadUsers = async () => {
    const data = await api.adminUsers(token, userKeyword);
    setUsers(data);
  };

  const loadTransactions = async () => {
    const data = await api.adminTransactions(token, { keyword: txKeyword });
    setTransactions(data);
  };

  const loadAuditLogs = async () => {
    const data = await api.adminAuditLogs(token, auditKeyword);
    setAuditLogs(data);
  };

  useEffect(() => {
    withLoader(async () => {
      await Promise.all([loadDashboard(), loadWithdraws(), loadUsers(), loadTransactions(), loadAuditLogs()]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleReview = async (id: number, status: "SUCCESS" | "FAILED") => {
    await withLoader(async () => {
      await api.adminReviewWithdraw(token, id, {
        status,
        note: reviewNote[id] || undefined,
      });
      setMessage(status === "SUCCESS" ? "Đã duyệt thành công." : "Đã từ chối giao dịch.");
      await Promise.all([loadDashboard(), loadWithdraws()]);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-amber-600 font-bold text-2xl">Quản trị hệ thống</h2>
            <p className="text-sm text-gray-600">Portal admin theo theme client, tích hợp RBAC backend</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            ADMIN MODE
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {adminTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === item.key
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="text-sm font-semibold text-green-700 text-center">{message}</p>}
      {error && <p className="text-sm font-semibold text-red-600 text-center">{error}</p>}
      {loading && <p className="text-sm font-semibold text-amber-700 text-center">Đang tải dữ liệu...</p>}

      {tab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <Activity className="w-5 h-5" />
              Đang chờ duyệt
            </div>
            <p className="text-3xl font-bold text-gray-800">{dashboard?.pendingWithdraws ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <Users className="w-5 h-5" />
              Tổng user
            </div>
            <p className="text-3xl font-bold text-gray-800">{dashboard?.totalUsers ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <Wallet className="w-5 h-5" />
              Tổng nạp
            </div>
            <p className="text-2xl font-bold text-gray-800">{(dashboard?.totalDeposits ?? 0).toLocaleString("vi-VN")}đ</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5">
            <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
              <Wallet className="w-5 h-5" />
              Tổng rút
            </div>
            <p className="text-2xl font-bold text-gray-800">{(dashboard?.totalWithdraws ?? 0).toLocaleString("vi-VN")}đ</p>
          </div>
        </div>
      )}

      {tab === "withdraw" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 space-y-4">
            <h3 className="text-amber-600 font-bold text-lg">Danh sách chờ duyệt</h3>
            {pendingWithdraws.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-800">#{item.id} - {item.amount.toLocaleString("vi-VN")}đ</p>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${statusClassName(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Bank: {item.bankName || "-"} / {item.bankAccount || "-"}</p>
                <input
                  value={reviewNote[item.id] ?? ""}
                  onChange={(e) => setReviewNote((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Ghi chú duyệt/từ chối..."
                  className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-800"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(item.id, "SUCCESS")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReview(item.id, "FAILED")}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
            {pendingWithdraws.length === 0 && <p className="text-sm text-gray-500">Không có giao dịch chờ duyệt.</p>}
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 space-y-4">
            <h3 className="text-amber-600 font-bold text-lg">Lịch sử rút tiền</h3>
            {maxRecentWithdraws.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">#{item.id} - {item.amount.toLocaleString("vi-VN")}đ</span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${statusClassName(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={userKeyword}
              onChange={(e) => setUserKeyword(e.target.value)}
              placeholder="Tìm theo username/sđt..."
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => withLoader(loadUsers)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Tìm
            </button>
          </div>
          <div className="space-y-2">
            {maxUsers.map((u) => (
              <div key={u.id} className="p-3 rounded-lg border border-gray-300 bg-gray-50 flex justify-between text-sm">
                <span>{u.username} ({u.phone})</span>
                <span className="font-semibold text-amber-700">{u.role} - {u.balance.toLocaleString("vi-VN")}đ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={txKeyword}
              onChange={(e) => setTxKeyword(e.target.value)}
              placeholder="Tìm theo bank/account/note..."
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => withLoader(loadTransactions)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Tìm
            </button>
          </div>
          <div className="space-y-2">
            {maxTransactions.map((t) => (
              <div key={t.id} className="p-3 rounded-lg border border-gray-300 bg-gray-50 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">#{t.id} {t.type} - {t.amount.toLocaleString("vi-VN")}đ</span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${statusClassName(t.status)}`}>
                    {statusLabel(t.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{new Date(t.createdAt).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-300 p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={auditKeyword}
              onChange={(e) => setAuditKeyword(e.target.value)}
              placeholder="Lọc action..."
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => withLoader(loadAuditLogs)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Lọc
            </button>
          </div>
          <div className="space-y-2">
            {maxAuditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border border-gray-300 bg-gray-50 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{log.action}</span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${log.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {log.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                    {log.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  reqId: {log.requestId} | {new Date(log.createdAt).toLocaleString("vi-VN")}
                </p>
                {log.detail && <p className="text-xs text-gray-700 mt-1">{log.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
