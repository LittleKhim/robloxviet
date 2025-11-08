# Hướng Dẫn Kết Nối MySQL Hostinger

## Bước 1: Lấy Thông Tin MySQL từ Hostinger

1. **Đăng nhập Hostinger Control Panel**
   - Vào https://hpanel.hostinger.com
   - Đăng nhập với tài khoản của bạn

2. **Truy cập MySQL Databases**
   - Tìm mục **"MySQL Databases"** hoặc **"Databases"**
   - Click vào để xem danh sách databases

3. **Ghi lại thông tin:**
   - **Database Name**: Ví dụ `u912867947_databases`
   - **MySQL User**: Ví dụ `u912867947_admin`
   - **MySQL Password**: Password bạn đã tạo (nếu quên, có thể reset)
   - **Host**: Thường là `localhost` hoặc IP được cung cấp

## Bước 2: Truy Cập phpMyAdmin

1. **Từ MySQL Databases page:**
   - Click nút **"Nhập phpMyAdmin"** (Enter phpMyAdmin)
   - Hoặc vào **"phpMyAdmin"** từ menu

2. **Đăng nhập phpMyAdmin:**
   - Username: MySQL User (ví dụ: `u912867947_admin`)
   - Password: MySQL Password
   - Server: `localhost` (hoặc IP được cung cấp)

3. **Import Database Schema:**
   - **QUAN TRỌNG:** Chọn database của bạn (ví dụ: `u912867947_databases`) từ menu bên trái TRƯỚC KHI chạy SQL
   - Click tab **"SQL"**
   - **Sử dụng file:** `backend/database/schema-no-create-db.sql` (đã bỏ phần CREATE DATABASE)
   - Hoặc copy từ `backend/database/schema.sql` nhưng BỎ QUA 2 dòng đầu:
     - `CREATE DATABASE IF NOT EXISTS store_db...`
     - `USE store_db;`
   - Paste vào ô SQL
   - Click **"Go"** để chạy
   - Kiểm tra xem các tables đã được tạo chưa (bên trái sẽ hiện danh sách tables)

## Bước 3: Tạo File .env

1. **Tạo file `.env` trong thư mục `backend/`:**

```bash
cd backend
touch .env
```

2. **File `.env` đã được tạo sẵn với thông tin của bạn:**
   - File `backend/.env` đã có đầy đủ thông tin
   - Password: `@Khiem101081`
   - Database: `u912867947_databases`
   - User: `u912867947_admin`

**Lưu ý:**
- File `.env` đã được tạo và cấu hình sẵn
- Nếu Hostinger cung cấp IP thay vì `localhost`, sửa `DB_HOST` trong `.env`

## Bước 4: Test Kết Nối

1. **Cài đặt dependencies:**
```bash
cd backend
npm install
```

2. **Chạy server để test:**
```bash
npm start
```

3. **Kiểm tra console:**
   - Nếu thấy `✅ Connected to MySQL database` → Kết nối thành công!
   - Nếu có lỗi, kiểm tra lại thông tin trong `.env`

## Bước 5: Troubleshooting

### Lỗi "Access denied"
- Kiểm tra lại username và password trong `.env`
- Đảm bảo MySQL user có quyền truy cập database
- Trong Hostinger, kiểm tra MySQL user đã được gán vào database chưa

### Lỗi "Unknown database"
- Kiểm tra tên database trong `.env` có đúng không
- Đảm bảo database đã được tạo trong Hostinger

### Lỗi "Can't connect to MySQL server"
- Kiểm tra `DB_HOST` có đúng không (thường là `localhost`)
- Nếu Hostinger cung cấp IP, dùng IP đó
- Kiểm tra firewall của Hostinger

### Lỗi "Connection timeout"
- Kiểm tra `DB_PORT` (thường là 3306)
- Nếu Hostinger dùng port khác, cập nhật trong `.env`

## Bước 6: Deploy lên Hostinger

### Nếu dùng VPS Hosting:

1. **Upload code lên server:**
   - Upload toàn bộ project lên Hostinger VPS
   - SSH vào server

2. **Cài đặt Node.js (nếu chưa có):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Cài đặt dependencies:**
```bash
cd /path/to/your/project/backend
npm install --production
```

4. **Tạo file `.env`:**
```bash
nano .env
# Paste nội dung .env và lưu (Ctrl+X, Y, Enter)
```

5. **Chạy với PM2:**
```bash
npm install -g pm2
pm2 start server.js --name store-api
pm2 save
pm2 startup
```

### Nếu dùng Shared Hosting với Node.js:

1. **Upload code lên Hostinger**
2. **Cấu hình Node.js App trong Control Panel:**
   - Entry point: `backend/server.js`
   - Node version: 18.x hoặc 20.x
3. **Thêm Environment Variables:**
   - Vào Node.js App settings
   - Thêm các biến: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `PORT`
4. **Start app**

## Lưu Ý Bảo Mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env` lên Git
- File `.env` đã được thêm vào `.gitignore`
- Chỉ lưu `.env.example` trên Git
- Giữ password MySQL bí mật

## Kiểm Tra Kết Nối Từ Code

Sau khi cấu hình xong, bạn có thể test bằng cách:

```javascript
// Trong backend/server.js, sau khi connectDB()
const { getDB } = require('./config/database');
const db = getDB();

// Test query
const [rows] = await db.execute('SELECT 1 as test');
console.log('Database test:', rows);
```

Nếu thấy kết quả `[ { test: 1 } ]` → Kết nối thành công! ✅

