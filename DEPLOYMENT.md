# Deployment Guide - JSON-Based Version

## Changes Made:
- ✅ Removed MySQL/Prisma dependency
- ✅ Data stored in 2 JSON files: `be/src/db/users.json`, `be/src/db/transactions.json`
- ✅ Removed all admin routes and UI
- ✅ Only user features remain

## Backend (No MySQL needed!)

### Install & Run:
```bash
cd be
npm install
npm run dev    # Development
npm run build  # Production build
npm start      # Production
```

### JSON Files Location:
- `be/src/db/users.json` - User accounts
- `be/src/db/transactions.json` - Deposit/Withdraw transactions

## Frontend

### Install & Run:
```bash
cd fe
npm install
npm run dev    # Development
npm run build  # Production build
```

## Deploy to EC2 (Simple - No MySQL!)

```bash
# 1. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git pm2

# 2. Clone/Upload code
cd ~
# Upload your code here

# 3. Run Backend
cd rt/be
npm install
pm2 start npm --name rt-backend -- start
pm2 save
pm2 startup

# 4. Setup Nginx (optional)
sudo apt install -y nginx
# Configure nginx to proxy to port 4000
```

## Deploy Frontend to Vercel

```bash
cd fe
vercel deploy --prod
```

Set environment variable:
- `VITE_API_BASE_URL=http://your-ec2-ip:4000`

## Benefits:
- 💰 **No MySQL cost/setup**
- 🚀 **Fast deployment**
- 📦 **Portable - just copy JSON files**
- 🔧 **Easy backup - just copy 2 files**
