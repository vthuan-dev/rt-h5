import { MessageCircle, Mail, Phone, Clock, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const contactMethods = [
  { icon: MessageCircle, title: "Live Chat", info: "Trả lời ngay lập tức", link: "#chat" },
  { icon: Mail, title: "Email", info: "support@canruatien.vn", link: "mailto:support@canruatien.vn" },
  { icon: Phone, title: "Hotline", info: "1900 1234", link: "tel:19001234" },
];

const faqs = [
  {
    question: "Làm thế nào để nạp tiền vào tài khoản?",
    answer: "Bạn có thể nạp tiền qua tab 'Nạp tiền', chọn phương thức thanh toán phù hợp (chuyển khoản ngân hàng, ví điện tử, thẻ cào), sau đó làm theo hướng dẫn. Tiền sẽ được cộng tự động trong 1-5 phút.",
  },
  {
    question: "Tôi có thể rút tiền về tài khoản ngân hàng không?",
    answer: "Có, bạn truy cập tab 'Rút tiền', điền thông tin tài khoản ngân hàng và số tiền muốn rút. Thời gian xử lý từ 1-3 giờ làm việc. Phí rút tiền 0%.",
  },
  {
    question: "Tài khoản game có được bảo mật không?",
    answer: "Tất cả tài khoản game đều được kiểm duyệt kỹ lưỡng, xác minh nguồn gốc và bảo mật thông tin. Chúng tôi cam kết hoàn tiền 100% nếu tài khoản có vấn đề.",
  },
  {
    question: "Dịch vụ cày thuê mất bao lâu?",
    answer: "Thời gian phụ thuộc vào yêu cầu của bạn. Thông thường, cày từ rank Vàng lên Kim Cương mất 3-5 ngày. Chúng tôi có đội ngũ player chuyên nghiệp làm việc 24/7.",
  },
  {
    question: "Tôi quên mật khẩu, phải làm sao?",
    answer: "Bạn có thể click vào 'Quên mật khẩu' ở trang đăng nhập, nhập email đã đăng ký và làm theo hướng dẫn để reset mật khẩu mới.",
  },
];

export function SupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Contact & Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <a
                key={index}
                href={method.link}
                className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300 hover:border-amber-500 transition-all duration-300 hover:shadow-xl text-center"
              >
                <Icon className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                <h3 className="text-gray-800 mb-1 font-bold">{method.title}</h3>
                <p className="text-sm text-gray-600">{method.info}</p>
              </a>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 font-bold text-lg">Gửi yêu cầu hỗ trợ</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Họ tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Chủ đề</label>
              <select className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                <option>Vấn đề nạp tiền</option>
                <option>Vấn đề rút tiền</option>
                <option>Tài khoản game</option>
                <option>Dịch vụ</option>
                <option>Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Nội dung</label>
              <textarea
                rows={5}
                placeholder="Mô tả chi tiết vấn đề của bạn..."
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg transition-all font-medium shadow-md"
            >
              Gửi yêu cầu
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - FAQs & Hours */}
      <div className="space-y-6">
        {/* Working Hours */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
            <Clock className="w-5 h-5" />
            Giờ làm việc
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Thứ 2 - Thứ 6</span>
              <span className="text-gray-800 font-semibold">8:00 - 22:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thứ 7 - Chủ nhật</span>
              <span className="text-gray-800 font-semibold">9:00 - 21:00</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <span className="text-green-600 text-xs font-semibold">🟢 Đang online - Hỗ trợ ngay</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-amber-600 mb-4 flex items-center gap-2 font-bold text-lg">
            <HelpCircle className="w-5 h-5" />
            Câu hỏi thường gặp
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-800 font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-600 transition-transform ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="p-3 bg-gray-50 text-xs text-gray-700 border-t-2 border-gray-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
