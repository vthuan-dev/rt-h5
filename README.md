
# RT Fullstack (FE + BE)

Dự án đã được tách thành:

- `fe/`: frontend React + Vite
- `be/`: backend Express + Prisma + MySQL (có migration)

## 1) Chạy Frontend

```bash
cd fe
npm install
npm run dev
```

Frontend mặc định chạy trên `http://127.0.0.1:8081`.

Truy cập admin UI:
- login bằng tài khoản có role `ADMIN`
- mở `http://127.0.0.1:8081/#admin`
- hoặc bấm tab **Admin** trên thanh điều hướng (chỉ hiện với tài khoản ADMIN)

Tạo file `fe/.env` nếu cần đổi API backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:4000
```

## 2) Chạy Backend

```bash
cd be
npm install
cp .env.example .env
```

Sửa `.env`:

```env
PORT=4000
FRONTEND_ORIGIN=http://127.0.0.1:8081
JWT_SECRET=replace-with-a-strong-secret
DATABASE_URL="mysql://root:password@127.0.0.1:3306/rt_db"
REFRESH_TOKEN_DAYS=14
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX=10
WALLET_RATE_LIMIT_WINDOW_MS=60000
WALLET_RATE_LIMIT_MAX=30
```

Khởi tạo migrate + Prisma client:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

Chạy backend:

```bash
npm run dev
```

## 3) API chính

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout` (Bearer token)
- `GET /api/auth/me` (Bearer token)
- `GET /api/wallet/summary` (Bearer token)
- `POST /api/wallet/deposit` (Bearer token)
- `POST /api/wallet/withdraw` (Bearer token)
- `GET /api/wallet/transactions` (Bearer token)
- `GET /api/admin/dashboard` (Bearer token ADMIN)
- `GET /api/admin/withdraws/pending` (Bearer token ADMIN)
- `GET /api/admin/withdraws` (Bearer token ADMIN)
- `POST /api/admin/withdraws/:id/review` (Bearer token ADMIN)
- `GET /api/admin/users` (Bearer token ADMIN)
- `GET /api/admin/transactions` (Bearer token ADMIN)
- `GET /api/admin/audit-logs` (Bearer token ADMIN)

## 4) Bootstrap tài khoản admin

```bash
cd be
npm run seed:admin
```

Biến môi trường hỗ trợ:

```env
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PHONE=0900000000
ADMIN_SEED_PASSWORD=admin123456
```

## 5) Docker / Deploy nhanh

```bash
docker compose up -d --build
```

App qua Nginx tại `http://localhost:8080`, API đi qua `/api/*`.

## 6) CI

Đã thêm GitHub Actions tại `.github/workflows/ci.yml`:
- build frontend
- migrate Prisma trên MySQL service
- generate Prisma client
- build backend
