import { DollarSign } from "lucide-react";

const prices = [
  { price: "300k", points: "2tr4" },
  { price: "500k", points: "4tr" },
  { price: "800k", points: "6tr4" },
  { price: "1tr", points: "9tr" },
  { price: "2tr", points: "19tr" },
  { price: "3tr", points: "30tr" },
  { price: "5tr", points: "50tr" },
  { price: "10tr", points: "100tr" },
];

export function PriceList() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-gray-800">
        <div className="space-y-2">
          {prices.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0"
            >
              <span className="text-amber-600 text-xl">»</span>
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span className="min-w-[70px] text-gray-800 font-semibold text-lg">{item.price}</span>
              <span className="text-gray-500 text-xl font-bold">=</span>
              <span className="min-w-[70px] text-amber-600 font-bold text-lg">{item.points}</span>
              <span className="text-2xl">🐉</span>
              <span className="ml-auto text-gray-600 text-sm font-medium">GÓI GAME POINT</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center border-2 border-gray-300">
          <span className="text-3xl mb-2">💎</span>
          <p className="text-gray-700 font-medium">Tỉ lệ <span className="text-amber-600 font-bold">1:8</span></p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center border-2 border-gray-300">
          <span className="text-3xl mb-2">➡️</span>
          <p className="text-gray-700 font-medium">Ưu đãi cho người mua lần đầu</p>
        </div>
      </div>
    </div>
  );
}