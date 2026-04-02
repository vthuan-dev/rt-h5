
# RT Frontend (FE-only)

Dự án hiện chỉ còn frontend React + Vite.
Toàn bộ dữ liệu đăng ký/đăng nhập/nạp-rút được lưu local trên trình duyệt (JSON trong `localStorage`).

## 1) Chạy Frontend

```bash
cd fe
npm install
npm run dev
```

Frontend mặc định chạy trên `http://127.0.0.1:8081`.

## 2) Dữ liệu local JSON

Dữ liệu được lưu trong browser `localStorage`:
- `rt_users_json`
- `rt_transactions_json`
- `rt_session_json`

Để reset dữ liệu, xóa các key này trong DevTools > Application > Local Storage.
