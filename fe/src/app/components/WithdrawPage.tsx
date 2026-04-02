import { useEffect, useState } from "react";
import { Wallet, AlertCircle, History } from "lucide-react";
import { api, type WalletTransaction } from "../lib/api";

type WithdrawPageProps = {
  token: string | null;
  balance: number;
  onBalanceChange: (balance: number) => void;
};

export function WithdrawPage({ token, balance, onBalanceChange }: WithdrawPageProps) {
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("VCB");
  const [accountHolder, setAccountHolder] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<WalletTransaction[]>([]);

  const amountNumber = Number(amount.replace(/[^\d]/g, ""));

  const loadHistory = async () => {
    if (!token) return;
    try {
      const rows = await api.walletTransactions(token);
      setWithdrawHistory(rows.filter((x) => x.type === "WITHDRAW"));
    } catch {
      // keep current UI if history fails
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleWithdraw = async () => {
    if (!token) {
      setMessage("Vui lòng đăng nhập để rút tiền.");
      setError("");
      return;
    }
    if (!amountNumber || amountNumber < 100000) {
      setError("Số tiền rút tối thiểu là 100,000đ.");
      setMessage("");
      return;
    }
    if (amountNumber > balance) {
      setError("Số tiền rút vượt quá số dư hiện tại.");
      setMessage("");
      return;
    }
    if (!bankAccount || !accountHolder) {
      setError("Vui lòng nhập đầy đủ thông tin rút tiền.");
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.withdraw(token, {
        amount: amountNumber,
        idempotencyKey: crypto.randomUUID(),
        bankName,
        bankAccount,
        accountHolder,
      });
      onBalanceChange(res.balance);
      setMessage(res.message);
      await loadHistory();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Rút tiền thất bại.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Withdraw Form */}
      <div className="space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-lg p-6 border-2 border-amber-600">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 text-white" />
            <p className="text-white/90 text-sm font-medium">Số dư khả dụng</p>
          </div>
          <p className="text-3xl text-white font-bold">{balance.toLocaleString("vi-VN")}đ</p>
          <p className="text-xs text-white/80 mt-2">≈ {balance * 8} 🐉 Game Points</p>
        </div>

        {/* Withdraw Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 font-bold text-lg">Yêu cầu rút tiền</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Số tiền rút</label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tiền"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">đ</span>
              </div>
              <div className="flex gap-2 mt-2">
                {["100,000", "500,000", "1,000,000"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-amber-500 transition-colors font-medium"
                  >
                    {preset}đ
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Ngân hàng</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="VCB">Vietcombank (VCB)</option>
                <option value="ACB">Á Châu (ACB)</option>
                <option value="TCB">Techcombank (TCB)</option>
                <option value="CTG">Vietinbank (CTG)</option>
                <option value="MB">MB Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Số tài khoản</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản ngân hàng"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Tên chủ tài khoản</label>
              <input
                type="text"
                placeholder="NGUYEN VAN A"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-md border border-blue-200 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Thời gian xử lý: 1-3 giờ làm việc. Phí rút tiền: 0%. Số tiền tối thiểu: 100,000đ
              </p>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : "Xác nhận rút tiền"}
            </button>
            {message && <p className="text-sm text-center font-medium text-green-700">{message}</p>}
            {error && <p className="text-sm text-center font-medium text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      {/* Right Column - History */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
        <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
          <History className="w-5 h-5" />
          Lịch sử rút tiền
        </h3>

        <div className="space-y-3">
          {withdrawHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300 hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg text-gray-800 font-bold">{item.amount.toLocaleString("vi-VN")}đ</span>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    item.status === "SUCCESS"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status === "SUCCESS" ? "Thành công" : item.status === "PENDING" ? "Đang xử lý" : "Thất bại"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>📅 {new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                <span>🕐 {new Date(item.createdAt).toLocaleTimeString("vi-VN")}</span>
              </div>
            </div>
          ))}
        </div>

        {withdrawHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có lịch sử rút tiền</p>
          </div>
        )}
      </div>
    </div>
  );
}
