import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";

const tabs = ["1. ĐĂNG KÝ TÀI KHOẢN", "2. LIÊN KẾT NGÂN HÀNG", "3. NẠP TIỀN"];
const banks = ["VCB", "ACB", "TCB", "CTG"];

type RegistrationFormProps = {
  onAuthSuccess: (token: string, refreshToken: string) => void;
};

export function RegistrationForm({ onAuthSuccess }: RegistrationFormProps) {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", phone: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [bankSelections, setBankSelections] = useState<Record<string, string>>(
    Object.fromEntries(banks.map((b) => [b, b]))
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      onAuthSuccess(res.token, res.refreshToken);
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
      onAuthSuccess(res.token, res.refreshToken);
      setMessage(`Đăng nhập thành công. Xin chào ${res.user.username}!`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Đăng nhập thất bại.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1 */}
      <div className="bg-white rounded-xl shadow-lg border-4 border-gray-800 overflow-hidden">
        <div className="flex border-b-2 border-gray-800 bg-slate-800">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex-1 py-3 text-xs text-center transition-all duration-300 font-medium ${
                step === i
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {step === 0 && (
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
              {banks.map((bank) => (
                <div key={bank} className="flex items-center gap-4">
                  <span className="w-20 text-amber-600 font-bold text-lg">{bank} 🏦</span>
                  <select
                    value={bankSelections[bank]}
                    onChange={(e) =>
                      setBankSelections({ ...bankSelections, [bank]: e.target.value })
                    }
                    className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {banks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md"
              >
                TIẾP THEO: NẠP TIỀN
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-center text-gray-800 font-bold text-lg">Nạp tiền [Gói 10tr]</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>Ngân hàng: <span className="text-gray-900 font-semibold">Gói 10tr</span></p>
                <p>Số tài khoản: <span className="text-gray-900 font-semibold">8097 2337 0830900</span></p>
                <p>Mật khẩu thoại: <span className="text-gray-900 font-semibold">023 456788</span></p>
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
