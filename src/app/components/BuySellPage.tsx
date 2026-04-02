import { Search, Star, ShieldCheck } from "lucide-react";

const gameAccounts = [
  { id: 1, game: "Liên Quân Mobile", rank: "Kim Cương", price: "1,500,000đ", heroes: 89, skins: 45, rating: 4.8 },
  { id: 2, game: "PUBG Mobile", rank: "Conqueror", price: "2,800,000đ", heroes: 0, skins: 32, rating: 4.9 },
  { id: 3, game: "Free Fire", rank: "Heroic", price: "900,000đ", heroes: 0, skins: 28, rating: 4.7 },
  { id: 4, game: "Liên Minh Huyền Thoại", rank: "Thách Đấu", price: "3,500,000đ", heroes: 156, skins: 78, rating: 5.0 },
  { id: 5, game: "Tốc Chiến", rank: "Cao Thủ", price: "1,200,000đ", heroes: 67, skins: 34, rating: 4.6 },
  { id: 6, game: "Valorant", rank: "Diamond", price: "2,200,000đ", heroes: 21, skins: 15, rating: 4.8 },
];

export function BuySellPage() {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản game..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Game Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gameAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-300 overflow-hidden hover:border-amber-500 transition-all duration-300 hover:shadow-xl"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-amber-600 font-bold">{account.game}</h3>
                  <p className="text-sm text-gray-600 mt-1">Rank: {account.rank}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                  <Star className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span className="text-xs text-amber-700 font-semibold">{account.rating}</span>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-600">
                {account.heroes > 0 && <span>🎮 {account.heroes} Heroes</span>}
                <span>✨ {account.skins} Skins</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-600">
                <ShieldCheck className="w-4 h-4" />
                <span>Đã xác minh</span>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-2xl text-amber-600 font-bold">{account.price}</span>
                <button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium">
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}