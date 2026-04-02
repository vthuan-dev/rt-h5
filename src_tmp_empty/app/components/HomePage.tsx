import { PriceList } from "./PriceList";
import { RegistrationForm } from "./RegistrationForm";

type HomePageProps = {
  onAuthSuccess: (token: string, refreshToken: string) => void;
};

export function HomePage({ onAuthSuccess }: HomePageProps) {
  return (
    <>
      <h1
        className="text-center mb-8 text-4xl font-bold"
        style={{
          color: "#d4a855",
          textShadow: `
            -1px -1px 0 #8b6914,
            1px -1px 0 #8b6914,
            -1px 1px 0 #8b6914,
            1px 1px 0 #8b6914,
            0 0 10px rgba(212, 168, 85, 0.3)
          `,
          letterSpacing: "0.05em",
        }}
      >
        BẢNG GIÁ DỊCH VỤ VÀ ĐĂNG KÝ NẠP TIỀN CHÍNH THỨC
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PriceList />
        <RegistrationForm onAuthSuccess={onAuthSuccess} />
      </div>
    </>
  );
}
