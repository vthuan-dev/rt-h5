import { PriceList } from "./components/PriceList";
import { RegistrationForm } from "./components/RegistrationForm";
import { HomePage } from "./components/HomePage";
import { BuySellPage } from "./components/BuySellPage";
import { DepositPage } from "./components/DepositPage";
import { WithdrawPage } from "./components/WithdrawPage";
import { ServicesPage } from "./components/ServicesPage";
import { SupportPage } from "./components/SupportPage";
import { AdminPage } from "./components/AdminPage";
import { useEffect, useState } from "react";
import { Home, Gamepad2, CreditCard, Wallet, Settings, HeadphonesIcon, Shield, Menu, X } from "lucide-react";
import { api } from "./lib/api";

const navItems = [
  { label: "Trang chủ", icon: Home },
  { label: "Mua bán TK Game", icon: Gamepad2 },
  { label: "Nạp tiền", icon: CreditCard },
  { label: "Rút tiền", icon: Wallet },
  { label: "Dịch vụ", icon: Settings },
  { label: "Hỗ trợ", icon: HeadphonesIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("refresh_token"));
  const [username, setUsername] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);
  const isAdmin = role === "ADMIN";
  const navItemsWithAdmin = isAdmin ? [...navItems, { label: "Admin", icon: Shield }] : navItems;

  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setRefreshToken(null);
    setUsername("");
    setBalance(0);
    setRole(null);
  };

  useEffect(() => {
    if (!token) {
      setUsername("");
      setBalance(0);
      return;
    }

    const loadMe = async () => {
      try {
        const me = await api.me(token);
        setUsername(me.username);
        setBalance(me.balance);
        setRole(me.role);
      } catch {
        if (!refreshToken) {
          clearAuth();
          return;
        }

        try {
          const refreshed = await api.refresh(refreshToken);
          localStorage.setItem("auth_token", refreshed.token);
          localStorage.setItem("refresh_token", refreshed.refreshToken);
          setToken(refreshed.token);
          setRefreshToken(refreshed.refreshToken);
        } catch {
          clearAuth();
        }
      }
    };

    loadMe();
  }, [token, refreshToken]);

  useEffect(() => {
    if (isAdmin && window.location.hash === "#admin") {
      setActiveTab(navItems.length);
    }
    if (!isAdmin && activeTab > navItems.length - 1) {
      setActiveTab(0);
    }
  }, [isAdmin, activeTab]);

  const handleAuthSuccess = (nextToken: string, nextRefreshToken: string, userRole?: "USER" | "ADMIN") => {
    localStorage.setItem("auth_token", nextToken);
    localStorage.setItem("refresh_token", nextRefreshToken);
    setToken(nextToken);
    setRefreshToken(nextRefreshToken);
    
    // Nếu là admin thì redirect đến trang admin
    if (userRole === "ADMIN") {
      setActiveTab(navItems.length);
      window.history.replaceState(null, "", "#admin");
    }
  };

  const handleLogout = async () => {
    if (token && refreshToken) {
      try {
        await api.logout(token, refreshToken);
      } catch {
        // keep logout UX even if API fails
      }
    }
    clearAuth();
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (isAdmin && index === navItems.length) {
      window.history.replaceState(null, "", "#admin");
      return;
    }
    if (window.location.hash === "#admin") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="min-h-screen relative bg-blue-50">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #e3f2fd 0%, #e8f4f8 50%, #e3f2fd 100%)",
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://e7.pngegg.com/pngimages/99/471/png-clipart-japanese-dragon-chinese-dragon-dragon-leaf-dragon-thumbnail.png"
                alt="CANRUATIEN Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <p className="text-gray-800 font-semibold" style={{ fontSize: "1.2rem" }}>
                  CANRUATIEN
                </p>
                <p className="text-xs text-gray-500">GAME TRANSACTION PORTAL</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 mr-4">
              {token ? (
                <>
                  <span className="text-sm text-gray-600">Xin chào, <b>{username || "User"}</b></span>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    {balance.toLocaleString("vi-VN")}đ
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">Chưa đăng nhập</span>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItemsWithAdmin.map((item, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleTabChange(index)}
                    className={`px-5 py-2 text-sm font-medium transition-all duration-300 border-b-2 ${
                      isActive
                        ? "text-amber-700 border-amber-600"
                        : "text-gray-600 border-transparent hover:text-amber-700"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-amber-700 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-2 space-y-1">
              {navItemsWithAdmin.map((item, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      handleTabChange(index);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all duration-300 text-sm font-medium ${
                      isActive
                        ? "bg-amber-100 text-amber-700"
                        : "text-gray-600 hover:text-amber-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 0 && <HomePage onAuthSuccess={handleAuthSuccess} />}
        {activeTab === 1 && <BuySellPage />}
        {activeTab === 2 && <DepositPage token={token} balance={balance} onBalanceChange={setBalance} />}
        {activeTab === 3 && <WithdrawPage token={token} balance={balance} onBalanceChange={setBalance} />}
        {activeTab === 4 && <ServicesPage />}
        {activeTab === 5 && <SupportPage />}
        {activeTab === navItems.length && isAdmin && token && <AdminPage token={token} />}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-800 to-slate-900 border-t border-slate-700 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
          <p className="text-sm text-gray-300">Lerds of Service - Hornal</p>
          <p className="text-xs text-gray-400 max-w-2xl mx-auto">
            CANRUATIEN PORTAL - giá sato chiêm đằng số chơi cẩn điền chỉ đểm nước rúa mã.<br />
            Terms of Service - Angan hành, phể mua cũng khoản và vợ nhớt đầm tao rừng xực giản gnột thế hac.<br />
            Khán chức hẳng nập hấn thống ceng.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2024 CANRUATIEN PORTAL - All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
