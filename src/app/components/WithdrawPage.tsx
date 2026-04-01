import { useState } from "react";
import { Wallet, AlertCircle, History } from "lucide-react";

const withdrawHistory = [
  { id: 1, amount: "500,000đ", status: "Thành công", date: "01/04/2026", time: "14:30" },
  { id: 2, amount: "1,000,000đ", status: "Đang xử lý", date: "31/03/2026", time: "09:15" },
  { id: 3, amount: "300,000đ", status: "Thành công", date: "28/03/2026", time: "16:45" },
];

export function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("VCB");

  const balance = "5,230,000"; // Mock balance

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
          <p className="text-3xl text-white font-bold">{balance}đ</p>
          <p className="text-xs text-white/80 mt-2">≈ {parseFloat(balance.replace(/,/g, "")) * 8} 🐉 Game Points</p>
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
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-md border border-blue-200 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Thời gian xử lý: 1-3 giờ làm việc. Phí rút tiền: 0%. Số tiền tối thiểu: 100,000đ
              </p>
            </div>

            <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md">
              Xác nhận rút tiền
            </button>
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
                <span className="text-lg text-gray-800 font-bold">{item.amount}</span>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    item.status === "Thành công"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>📅 {item.date}</span>
                <span>🕐 {item.time}</span>
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
