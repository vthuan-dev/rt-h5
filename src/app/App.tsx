import { PriceList } from "./components/PriceList";
import { RegistrationForm } from "./components/RegistrationForm";
import { HomePage } from "./components/HomePage";
import { BuySellPage } from "./components/BuySellPage";
import { DepositPage } from "./components/DepositPage";
import { WithdrawPage } from "./components/WithdrawPage";
import { ServicesPage } from "./components/ServicesPage";
import { SupportPage } from "./components/SupportPage";
import { useState } from "react";
import { Home, Gamepad2, CreditCard, Wallet, Settings, HeadphonesIcon, Menu, X } from "lucide-react";

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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(index)}
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
              {navItems.map((item, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveTab(index);
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
        {activeTab === 0 && <HomePage />}
        {activeTab === 1 && <BuySellPage />}
        {activeTab === 2 && <DepositPage />}
        {activeTab === 3 && <WithdrawPage />}
        {activeTab === 4 && <ServicesPage />}
        {activeTab === 5 && <SupportPage />}
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