# Backend (Express + Prisma + MySQL)

## Setup

```bash
npm install
cp .env.example .env
```

Điền biến môi trường trong `.env`:

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

## Migration & Generate

```bash
npx prisma migrate deploy
npm run prisma:generate
```

## Run

```bash
npm run dev
```

## Bootstrap admin

```bash
npm run seed:admin
```

Optional env for admin seed:

```env
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PHONE=0900000000
ADMIN_SEED_PASSWORD=admin123456
```

## Build

```bash
npm run build
```
