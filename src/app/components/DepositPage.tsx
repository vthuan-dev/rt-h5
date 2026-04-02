import { useState } from "react";
import { CreditCard, QrCode, Copy, Check } from "lucide-react";
import { api } from "../lib/api";

const paymentMethods = [
  { id: "bank", name: "Chuyển khoản ngân hàng", icon: "🏦", fee: "0%" },
  { id: "momo", name: "Ví MoMo", icon: "📱", fee: "1%" },
  { id: "zalopay", name: "ZaloPay", icon: "💳", fee: "1%" },
  { id: "card", name: "Thẻ cào điện thoại", icon: "📞", fee: "15%" },
];

const packages = [
  { amount: "100,000đ", bonus: "+10,000đ", points: "110,000" },
  { amount: "200,000đ", bonus: "+25,000đ", points: "225,000" },
  { amount: "500,000đ", bonus: "+75,000đ", points: "575,000" },
  { amount: "1,000,000đ", bonus: "+200,000đ", points: "1,200,000" },
];

type DepositPageProps = {
  token: string | null;
  balance: number;
  onBalanceChange: (balance: number) => void;
};

export function DepositPage({ token, balance, onBalanceChange }: DepositPageProps) {
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [selectedPackage, setSelectedPackage] = useState(2);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAmount = Number(
    packages[selectedPackage].amount.replace(/[^\d]/g, "")
  );

  const handleDeposit = async () => {
    if (!token) {
      setMessage("Vui lòng đăng nhập để nạp tiền.");
      setError("");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.deposit(token, {
        amount: selectedAmount,
        paymentMethod: selectedMethod,
        idempotencyKey: crypto.randomUUID(),
      });
      onBalanceChange(res.balance);
      setMessage(res.message);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Nạp tiền thất bại.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Payment Method & Package */}
      <div className="space-y-6">
        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
            <CreditCard className="w-5 h-5" />
            Chọn phương thức thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedMethod === method.id
                    ? "bg-amber-600 border-amber-700 text-white shadow-lg"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:border-amber-500"
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <div className="text-xs mb-1 font-medium">{method.name}</div>
                <div className={`text-xs font-semibold ${selectedMethod === method.id ? "text-amber-100" : "text-amber-600"}`}>
                  Phí: {method.fee}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 font-bold text-lg">Chọn gói nạp</h3>
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg, index) => (
              <button
                key={index}
                onClick={() => setSelectedPackage(index)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedPackage === index
                    ? "bg-amber-600 border-amber-700 text-white shadow-lg"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:border-amber-500"
                }`}
              >
                <div className="text-lg mb-1 font-bold">{pkg.amount}</div>
                <div className={`text-xs ${selectedPackage === index ? "text-green-200" : "text-green-600"}`}>
                  {pkg.bonus}
                </div>
                <div className={`text-xs mt-1 ${selectedPackage === index ? "text-gray-100" : "text-gray-600"}`}>
                  = {pkg.points} 🐉
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Payment Info */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-300 text-sm text-gray-700">
          Số dư hiện tại: <span className="font-bold text-amber-600">{balance.toLocaleString("vi-VN")}đ</span>
        </div>
        {/* QR Code & Bank Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
            <QrCode className="w-5 h-5" />
            Thông tin chuyển khoản
          </h3>

          {/* QR Code Placeholder */}
          <div className="bg-gray-50 rounded-lg p-8 mb-4 flex items-center justify-center border-2 border-gray-300">
            <div className="text-center">
              <QrCode className="w-32 h-32 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Quét mã QR để thanh toán</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <p className="text-gray-600">Ngân hàng</p>
                <p className="text-gray-800 font-semibold">Vietcombank (VCB)</p>
              </div>
              <button
                onClick={() => handleCopy("Vietcombank")}
                className="text-amber-600 hover:text-amber-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <p className="text-gray-600">Số tài khoản</p>
                <p className="text-gray-800 font-semibold">1234567890</p>
              </div>
              <button
                onClick={() => handleCopy("1234567890")}
                className="text-amber-600 hover:text-amber-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <p className="text-gray-600">Chủ tài khoản</p>
                <p className="text-gray-800 font-semibold">NGUYEN VAN A</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <div>
                <p className="text-gray-600">Nội dung chuyển khoản</p>
                <p className="text-amber-600 font-bold">NAPTHE USER123</p>
              </div>
              <button
                onClick={() => handleCopy("NAPTHE USER123")}
                className="text-amber-600 hover:text-amber-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ Vui lòng chuyển khoản đúng nội dung để được cộng tiền tự động
            </p>
          </div>
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Xác nhận đã nạp tiền"}
          </button>
          {message && <p className="mt-3 text-sm text-center font-medium text-green-700">{message}</p>}
          {error && <p className="mt-2 text-sm text-center font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
