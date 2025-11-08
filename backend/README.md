# Store Backend - Hostinger MySQL

Backend API cho ứng dụng store, chạy trên Hostinger với MySQL database.

## Cài Đặt

### 1. Tạo MySQL Database

1. Đăng nhập vào Hostinger Control Panel
2. Vào **MySQL Databases**
3. Tạo database mới: `store_db`
4. Tạo user và password cho database
5. Ghi lại thông tin:
   - Database name: `store_db`
   - Username: `your_username`
   - Password: `your_password`
   - Host: `localhost` (hoặc IP được cung cấp)

### 2. Import Database Schema

1. Mở phpMyAdmin trong Hostinger
2. Chọn database `store_db`
3. Vào tab **SQL**
4. Copy và paste nội dung file `backend/database/schema.sql`
5. Click **Go** để chạy

### 3. Cài Đặt Dependencies

```bash
cd backend
npm install
```

### 4. Cấu Hình Environment Variables

**Lấy thông tin từ Hostinger:**
1. Đăng nhập Hostinger Control Panel
2. Vào **MySQL Databases**
3. Ghi lại:
   - Database Name (ví dụ: `u912867947_databases`)
   - MySQL User (ví dụ: `u912867947_admin`)
   - MySQL Password
   - Host (thường là `localhost`)

**Tạo file `.env` trong thư mục `backend/`:**

Copy từ `.env.example`:
```bash
cd backend
cp .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin thực tế:

```env
# MySQL Database Configuration (Hostinger)
DB_HOST=localhost
DB_USER=u912867947_admin
DB_PASSWORD=your_actual_password
DB_NAME=u912867947_databases
DB_PORT=3306

# Server Port
PORT=3000
```

**Xem hướng dẫn chi tiết trong file `HOSTINGER_SETUP.md`**

### 5. Chạy Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Deploy lên Hostinger

### Option 1: VPS Hosting (Recommended)

1. Upload toàn bộ project lên Hostinger VPS
2. SSH vào server
3. Cài đặt Node.js (nếu chưa có)
4. Chạy `npm install` trong thư mục `backend/`
5. Cấu hình `.env` file
6. Chạy server với PM2:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name store-api
   pm2 save
   pm2 startup
   ```

### Option 2: Shared Hosting với Node.js Support

1. Upload project lên Hostinger
2. Cấu hình Node.js app trong Control Panel
3. Set entry point: `backend/server.js`
4. Cấu hình environment variables trong Control Panel

## Cấu Hình Frontend

Trong file `store.html`, update `API_BASE_URL`:

```javascript
// Nếu frontend và backend cùng domain:
const API_BASE_URL = '/api';

// Nếu frontend và backend khác domain:
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## API Endpoints

- `GET /api/users/balance?email=...` - Lấy số dư
- `PUT /api/users/balance?email=...` - Cập nhật số dư
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/transactions` - Tạo giao dịch
- `GET /api/transactions?email=...` - Lấy giao dịch
- `POST /api/subscriptions` - Tạo subscription
- `GET /api/subscriptions?email=...` - Lấy subscription
- `GET /api/coupons` - Lấy danh sách coupons
- `POST /api/coupons` - Tạo coupon
- `GET /api/stock` - Lấy stock
- `PUT /api/stock` - Cập nhật stock

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra thông tin trong `.env` file
- Đảm bảo MySQL user có quyền truy cập database
- Kiểm tra firewall của Hostinger

### Lỗi port đã được sử dụng
- Thay đổi `PORT` trong `.env`
- Hoặc kill process đang dùng port đó

### Lỗi CORS
- Đảm bảo `cors` middleware đã được enable trong `server.js`
- Kiểm tra domain frontend có được phép truy cập

## Migration từ MongoDB

Nếu bạn có data trong MongoDB và muốn migrate sang MySQL:

1. Export data từ MongoDB
2. Convert format từ JSON sang SQL INSERT statements
3. Import vào MySQL

Hoặc tạo script migration riêng để tự động chuyển đổi.

