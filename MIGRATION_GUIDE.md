# Migration Guide: Vercel MongoDB → Hostinger MySQL

## Tổng Quan

Hướng dẫn chuyển đổi từ Vercel Serverless Functions + MongoDB Atlas sang Hostinger + MySQL.

## Bước 1: Chuẩn Bị MySQL Database

1. **Tạo database trên Hostinger:**
   - Đăng nhập Hostinger Control Panel
   - Vào **MySQL Databases**
   - Tạo database: `store_db`
   - Tạo user và password
   - Ghi lại thông tin connection

2. **Import schema:**
   - Mở phpMyAdmin
   - Chọn database `store_db`
   - Import file `backend/database/schema.sql`

## Bước 2: Cấu Hình Backend

1. **Cài đặt dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Tạo file `.env`:**
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=store_db
   DB_PORT=3306
   PORT=3000
   ```

3. **Test connection:**
   ```bash
   npm start
   ```

## Bước 3: Deploy Backend lên Hostinger

### Nếu có VPS:
```bash
# Upload code lên server
# SSH vào server
cd /path/to/backend
npm install
pm2 start server.js --name store-api
```

### Nếu Shared Hosting:
- Upload code qua FTP
- Cấu hình Node.js app trong Control Panel
- Set entry point: `backend/server.js`

## Bước 4: Update Frontend

Trong `store.html`, đảm bảo `API_BASE_URL` đúng:

```javascript
// Nếu cùng domain:
const API_BASE_URL = '/api';

// Nếu khác domain:
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## Bước 5: Xóa Vercel Files (Optional)

Sau khi đã deploy thành công, bạn có thể xóa:
- Thư mục `api/` (Vercel Serverless Functions)
- File `vercel.json` (nếu có)
- Các environment variables trong Vercel

## Bước 6: Migrate Data (Nếu cần)

Nếu bạn có data trong MongoDB và muốn chuyển sang MySQL:

1. Export data từ MongoDB
2. Convert format (JSON → SQL)
3. Import vào MySQL

Hoặc tạo script migration tự động.

## Kiểm Tra

1. ✅ Database connection thành công
2. ✅ API endpoints hoạt động
3. ✅ Frontend kết nối được với backend
4. ✅ Tất cả tính năng hoạt động bình thường

## Rollback (Nếu cần)

Nếu có vấn đề, bạn có thể:
1. Giữ nguyên Vercel deployment
2. Chỉ cần update `API_BASE_URL` trong frontend
3. Hoặc deploy lại lên Vercel

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs trong backend console
2. Kiểm tra MySQL connection
3. Kiểm tra CORS settings
4. Kiểm tra firewall của Hostinger

