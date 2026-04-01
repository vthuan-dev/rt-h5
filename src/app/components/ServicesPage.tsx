import { Shield, Zap, Users, Trophy, Headphones, Star } from "lucide-react";

const services = [
  {
    icon: Shield,
    title: "Bảo mật tài khoản",
    description: "Dịch vụ bảo mật và khôi phục tài khoản game bị mất",
    price: "199,000đ",
    features: ["Xác thực 2 lớp", "Backup dữ liệu", "Hỗ trợ 24/7"],
    popular: false,
  },
  {
    icon: Zap,
    title: "Cày thuê",
    description: "Dịch vụ cày rank, cày level chuyên nghiệp",
    price: "từ 50,000đ/ngày",
    features: ["Cày nhanh chóng", "Bảo mật thông tin", "Cam kết không hack"],
    popular: true,
  },
  {
    icon: Users,
    title: "Đồng hành",
    description: "Thuê player đồng hành chơi game cùng bạn",
    price: "30,000đ/giờ",
    features: ["Player chuyên nghiệp", "Giao tiếp thân thiện", "Linh hoạt thời gian"],
    popular: false,
  },
  {
    icon: Trophy,
    title: "Coaching",
    description: "Học hỏi kỹ năng từ các pro player",
    price: "100,000đ/session",
    features: ["1-on-1 coaching", "Phân tích gameplay", "Lộ trình học tập"],
    popular: false,
  },
];

const testimonials = [
  { name: "Nguyễn A", game: "Liên Quân", rating: 5, comment: "Dịch vụ rất tốt, cày rank nhanh!" },
  { name: "Trần B", game: "PUBG", rating: 5, comment: "Chuyên nghiệp, giá cả hợp lý" },
  { name: "Lê C", game: "Free Fire", rating: 4, comment: "Hỗ trợ nhiệt tình, sẽ dùng lại" },
];

export function ServicesPage() {
  return (
    <div className="space-y-6">
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                service.popular
                  ? "border-amber-500 relative"
                  : "border-gray-300 hover:border-amber-400"
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 right-4 bg-amber-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 font-semibold shadow-md">
                  <Star className="w-3 h-3 fill-white" />
                  Phổ biến
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Icon className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-600 mb-1 font-bold">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-2xl text-gray-800 font-bold">{service.price}</p>
              </div>

              <div className="space-y-2 mb-4">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 font-bold">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2.5 rounded-lg transition-all font-medium shadow-md">
                Đặt dịch vụ ngay
              </button>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
        <h3 className="text-amber-600 mb-4 font-bold text-lg">Quy trình sử dụng dịch vụ</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Chọn dịch vụ", desc: "Chọn dịch vụ phù hợp" },
            { step: "2", title: "Đặt hàng", desc: "Điền thông tin và thanh toán" },
            { step: "3", title: "Thực hiện", desc: "Đội ngũ bắt đầu làm việc" },
            { step: "4", title: "Hoàn thành", desc: "Nhận kết quả và đánh giá" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold shadow-md">
                {item.step}
              </div>
              <p className="text-gray-800 mb-1 font-semibold">{item.title}</p>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
        <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
          <Headphones className="w-5 h-5" />
          Đánh giá từ khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.game}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-2">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-gray-700 italic">"{item.comment}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
