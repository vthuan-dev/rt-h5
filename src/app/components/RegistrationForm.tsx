import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";

const tabs = ["1. ĐĂNG KÝ TÀI KHOẢN", "2. LIÊN KẾT NGÂN HÀNG", "3. NẠP TIỀN"];

type BankOption = {
  code: string;
  name: string;
  logo: string;
};

type RegistrationFormProps = {
  onAuthSuccess: (token: string, refreshToken: string, userRole?: "USER" | "ADMIN") => void;
  selectedDepositAmount: number;
};

const RECEIVER_BANK_ID = "VIB";
const RECEIVER_BANK_NAME = "VIB Ngân hàng Quốc Tế";
const RECEIVER_ACCOUNT_NUMBER = "081409781";
const RECEIVER_ACCOUNT_NAME = "PHAN NGOC CHUNG";
const DEPOSIT_REQUESTS_KEY = "deposit_requests_json";
const DEPOSIT_CONFIRM_COOLDOWN_MS = 10_000;

const packageNameByAmount: Record<number, string> = {
  300000: "GOI-300K",
  500000: "GOI-500K",
  800000: "GOI-800K",
  1000000: "GOI-1TR",
  2000000: "GOI-2TR",
  3000000: "GOI-3TR",
  5000000: "GOI-5TR",
  10000000: "GOI-10TR",
};

export function RegistrationForm({ onAuthSuccess, selectedDepositAmount }: RegistrationFormProps) {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isAuthenticatedInFlow, setIsAuthenticatedInFlow] = useState<boolean>(
    () => Boolean(localStorage.getItem("auth_token")),
  );
  const [isBankLinked, setIsBankLinked] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", phone: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [linkedBank, setLinkedBank] = useState({
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const loadBanks = async () => {
      setBankLoading(true);
      try {
        const response = await fetch("https://api.vietqr.io/v2/banks");
        if (!response.ok) {
          throw new Error("Không tải được danh sách ngân hàng.");
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];

        const normalized: BankOption[] = rows
          .filter((item: unknown) => typeof item === "object" && item !== null)
          .map((item: Record<string, unknown>) => ({
            code: String(item.code ?? ""),
            name: String(item.shortName ?? item.name ?? ""),
            logo: String(item.logo ?? ""),
          }))
          .filter((item) => item.code && item.name && item.logo)
          .slice(0, 24);

        if (normalized.length === 0) {
          throw new Error("Danh sách ngân hàng rỗng.");
        }

        setBanks(normalized);
        setLinkedBank((prev) => ({
          ...prev,
          bankCode: prev.bankCode || normalized[0].code,
        }));
      } catch {
        const fallback: BankOption[] = [
          { code: "VCB", name: "Vietcombank", logo: "https://cdn.vietqr.io/img/VCB.png" },
          { code: "ACB", name: "ACB", logo: "https://cdn.vietqr.io/img/ACB.png" },
          { code: "TCB", name: "Techcombank", logo: "https://cdn.vietqr.io/img/TCB.png" },
          { code: "ICB", name: "VietinBank", logo: "https://cdn.vietqr.io/img/ICB.png" },
        ];
        setBanks(fallback);
        setLinkedBank((prev) => ({
          ...prev,
          bankCode: prev.bankCode || fallback[0].code,
        }));
      } finally {
        setBankLoading(false);
      }
    };

    loadBanks();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DEPOSIT_REQUESTS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Array<{ cooldownUntil?: number }>;
      const latest = parsed.at(-1);
      if (!latest?.cooldownUntil) return;
      if (latest.cooldownUntil > Date.now()) {
        setCooldownUntil(latest.cooldownUntil);
        setIsTransferConfirmed(true);
        setMessage("Cảm ơn bạn, vui lòng chờ admin duyệt. Thông tin đã được gửi đến hệ thống.");
      }
    } catch {
      // ignore invalid local json
    }
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const handleRegister = async () => {
    if (!form.username || form.username.length < 3) {
      setError("Tên đăng nhập tối thiểu 3 ký tự.");
      setMessage("");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      setMessage("");
      return;
    }
    if (!form.phone || form.phone.length < 8) {
      setError("Số điện thoại không hợp lệ.");
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.register(form);
      onAuthSuccess(res.token, res.refreshToken, res.user.role);
      setIsAuthenticatedInFlow(true);
      setIsBankLinked(false);
      setMessage(`Đăng ký thành công. Xin chào ${res.user.username}!`);
      setStep(1);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Đăng ký thất bại.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError("Vui lòng nhập tài khoản và mật khẩu đăng nhập.");
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await api.login(loginForm);
      onAuthSuccess(res.token, res.refreshToken, res.user.role);
      setIsAuthenticatedInFlow(true);
      setIsBankLinked(false);
      setMessage(`Đăng nhập thành công. Xin chào ${res.user.username}!`);
      setStep(1);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Đăng nhập thất bại.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBank = () => {
    if (!linkedBank.bankCode) {
      setError("Vui lòng chọn ngân hàng.");
      setMessage("");
      return;
    }
    const normalizedAccount = linkedBank.accountNumber.replace(/\s/g, "");
    if (!/^\d{8,20}$/.test(normalizedAccount)) {
      setError("Số tài khoản phải từ 8-20 chữ số.");
      setMessage("");
      return;
    }
    if (linkedBank.accountName.trim().length < 3) {
      setError("Tên chủ tài khoản không hợp lệ.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("Liên kết ngân hàng thành công.");
    setIsTransferConfirmed(false);
    setIsBankLinked(true);
    setStep(2);
  };

  const handleConfirmTransferred = () => {
    const remaining = cooldownUntil - Date.now();
    if (remaining > 0 || isConfirmingTransfer) {
      return;
    }

    setError("");
    setMessage("");
    setIsConfirmingTransfer(true);

    window.setTimeout(() => {
      const createdAtMs = Date.now();
      const cooldownUntilMs = createdAtMs + DEPOSIT_CONFIRM_COOLDOWN_MS;
      const requestPayload = {
        id: `req_${createdAtMs}`,
        bankId: RECEIVER_BANK_ID,
        bankName: RECEIVER_BANK_NAME,
        accountNumber: RECEIVER_ACCOUNT_NUMBER,
        accountName: RECEIVER_ACCOUNT_NAME,
        packageName,
        amount: selectedDepositAmount,
        transferContent,
        createdAt: new Date(createdAtMs).toISOString(),
        createdAtMs,
        cooldownUntil: cooldownUntilMs,
        status: "PENDING_ADMIN_REVIEW",
      };

      try {
        const raw = localStorage.getItem(DEPOSIT_REQUESTS_KEY);
        const list = raw ? (JSON.parse(raw) as unknown[]) : [];
        const nextList = Array.isArray(list) ? [...list, requestPayload] : [requestPayload];
        localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify(nextList));
      } catch {
        localStorage.setItem(DEPOSIT_REQUESTS_KEY, JSON.stringify([requestPayload]));
      }

      setCooldownUntil(cooldownUntilMs);
      setIsTransferConfirmed(true);
      setIsConfirmingTransfer(false);
      setMessage("Cảm ơn bạn, vui lòng chờ admin duyệt. Thông tin đã được gửi đến hệ thống.");
    }, 1200);
  };

  const selectedBank = banks.find((b) => b.code === linkedBank.bankCode) ?? banks[0];
  const packageName = packageNameByAmount[selectedDepositAmount] ?? "GOI-TUY-CHON";
  const transferContent = `NAPTIEN ${packageName} ${selectedDepositAmount}`;
  const qrSrc = `https://img.vietqr.io/image/${RECEIVER_BANK_ID}-${RECEIVER_ACCOUNT_NUMBER}-compact2.png?amount=${selectedDepositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(RECEIVER_ACCOUNT_NAME)}`;
  const visibleTabs = isAuthenticatedInFlow ? tabs.slice(1) : tabs;
  const cooldownRemainingSeconds = Math.max(0, Math.ceil((cooldownUntil - nowMs) / 1000));

  const isTabLocked = (targetStep: number) => {
    if (!isAuthenticatedInFlow && targetStep > 0) return true;
    if (isAuthenticatedInFlow && targetStep === 2 && !isBankLinked) return true;
    return false;
  };

  const handleTabClick = (targetStep: number) => {
    if (!isAuthenticatedInFlow && targetStep > 0) {
      setError("Vui lòng đăng nhập hoặc đăng ký trước khi sang bước tiếp theo.");
      setMessage("");
      setStep(0);
      return;
    }
    if (isAuthenticatedInFlow && targetStep === 2 && !isBankLinked) {
      setError("Hoàn tất bước 2 và bấm nút TIẾP THEO để sang bước 3.");
      setMessage("");
      return;
    }
    setError("");
    setStep(targetStep);
  };

  return (
    <div className="space-y-4">
      {/* Step 1 */}
      <div className="bg-white rounded-xl shadow-lg border-4 border-gray-800 overflow-hidden">
        <div className="flex border-b-2 border-gray-800 bg-slate-800">
          {visibleTabs.map((tab, i) => {
            const actualStep = isAuthenticatedInFlow ? i + 1 : i;
            const locked = isTabLocked(actualStep);
            return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(actualStep)}
              disabled={locked}
              className={`flex-1 py-3 text-xs text-center transition-all duration-300 font-medium ${
                step === actualStep
                  ? "bg-slate-700 text-white"
                  : locked
                    ? "bg-slate-800 text-gray-500 cursor-not-allowed"
                    : "bg-slate-800 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
            );
          })}
        </div>

        <div className="p-6">
          {step === 0 && !isAuthenticatedInFlow && (
            <div className="space-y-4">
              {!isLoginMode ? (
                // FORM ĐĂNG KÝ
                <>
                  <h3 className="text-center text-gray-800 font-bold text-lg">ĐĂNG KÝ NGƯỜI DÙNG MỚI</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Số điện thoại</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md disabled:opacity-60"
                  >
                    {loading ? "Đang xử lý..." : "ĐĂNG KÝ TÀI KHOẢN"}
                  </button>

                  <div className="pt-3 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Đã có tài khoản?{" "}
                      <button
                        onClick={() => {
                          setIsLoginMode(true);
                          setError("");
                          setMessage("");
                        }}
                        className="text-amber-600 hover:text-amber-700 font-semibold underline"
                      >
                        Đăng nhập ngay
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                // FORM ĐĂNG NHẬP
                <>
                  <h3 className="text-center text-gray-800 font-bold text-lg">ĐĂNG NHẬP</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Tên đăng nhập</label>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-lg transition-all font-medium shadow-md disabled:opacity-60"
                  >
                    {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                  </button>

                  <div className="pt-3 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Chưa có tài khoản?{" "}
                      <button
                        onClick={() => {
                          setIsLoginMode(false);
                          setError("");
                          setMessage("");
                        }}
                        className="text-amber-600 hover:text-amber-700 font-semibold underline"
                      >
                        Đăng ký ngay
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-center text-gray-800 font-bold text-lg">Chọn ngân hàng để liên kết</p>
              {isAuthenticatedInFlow && !isBankLinked && (
                <p className="text-center text-sm text-gray-600">
                  Hoàn tất thông tin bên dưới và bấm <b>TIẾP THEO: NẠP TIỀN</b> để mở bước 3.
                </p>
              )}
              {bankLoading && (
                <p className="text-center text-sm font-medium text-amber-700">Đang tải danh sách ngân hàng...</p>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ngân hàng</label>
                <select
                  value={linkedBank.bankCode}
                  onChange={(e) => setLinkedBank((prev) => ({ ...prev, bankCode: e.target.value }))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  disabled={bankLoading || banks.length === 0}
                >
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.code} - {bank.name}
                    </option>
                  ))}
                </select>
                {selectedBank?.logo && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={selectedBank.logo}
                      alt={`${selectedBank.name} logo`}
                      className="w-7 h-7 object-contain rounded bg-white"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedBank.name} ({selectedBank.code})
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Số tài khoản</label>
                <input
                  type="text"
                  value={linkedBank.accountNumber}
                  onChange={(e) => setLinkedBank((prev) => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Nhập số tài khoản ngân hàng"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Tên chủ tài khoản</label>
                <input
                  type="text"
                  value={linkedBank.accountName}
                  onChange={(e) => setLinkedBank((prev) => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <button
                onClick={handleLinkBank}
                disabled={bankLoading || banks.length === 0}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md"
              >
                TIẾP THEO: NẠP TIỀN
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-center text-gray-800 font-bold text-lg">
                Nạp tiền [{selectedDepositAmount.toLocaleString("vi-VN")}đ]
              </h3>
              {!isTransferConfirmed && !isConfirmingTransfer && (
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                  <img
                    src={qrSrc}
                    alt="VietQR nạp tiền"
                    className="w-full max-w-xs mx-auto rounded-lg border border-gray-200 bg-white"
                  />
                  <p className="mt-2 text-center text-sm text-gray-600">Quét mã VietQR để chuyển khoản nhanh</p>
                </div>
              )}
              {isConfirmingTransfer && (
                <div className="bg-amber-50 rounded-lg p-5 border-2 border-amber-200 text-center">
                  <p className="text-amber-700 font-semibold">Đang gửi yêu cầu xác nhận chuyển khoản...</p>
                </div>
              )}
              {isTransferConfirmed && !isConfirmingTransfer && (
                <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200 text-center">
                  <p className="text-green-700 font-semibold">
                    Đã gửi xác nhận thành công. Bạn có thể gửi yêu cầu nạp tiếp sau {cooldownRemainingSeconds}s.
                  </p>
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  Ngân hàng:
                  {selectedBank?.logo ? (
                    <img
                      src={selectedBank.logo}
                      alt={`${selectedBank.name} logo`}
                      className="w-5 h-5 object-contain rounded bg-white"
                    />
                  ) : (
                    <span className="inline-block w-5 h-5 rounded bg-gray-200" />
                  )}
                  <span className="text-gray-900 font-semibold">
                    Napas 247 | {RECEIVER_BANK_NAME}
                  </span>
                </p>
                <p>Số tài khoản nhận: <span className="text-gray-900 font-semibold">{RECEIVER_ACCOUNT_NUMBER}</span></p>
                <p>Chủ tài khoản: <span className="text-gray-900 font-semibold">{RECEIVER_ACCOUNT_NAME}</span></p>
                <p>Số tiền chuyển: <span className="text-gray-900 font-semibold">{selectedDepositAmount.toLocaleString("vi-VN")}đ</span></p>
                <p>Nội dung chuyển khoản: <span className="text-amber-700 font-bold">{transferContent}</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Progress:</p>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-gray-300">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                    style={{ width: "70%" }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmTransferred}
                disabled={isConfirmingTransfer || cooldownRemainingSeconds > 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg transition-all font-medium shadow-md"
              >
                {isConfirmingTransfer
                  ? "ĐANG GỬI..."
                  : cooldownRemainingSeconds > 0
                    ? `NẠP TIẾP SAU ${cooldownRemainingSeconds}s`
                    : "XÁC NHẬN ĐÃ CHUYỂN"}
              </button>
            </div>
          )}

          {message && (
            <p className="mt-4 text-sm text-center font-medium text-green-700">{message}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-center font-medium text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
