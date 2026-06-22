# QUICK REFERENCE GUIDE

## 🚀 Quick Start (5 minutes)

### Windows
```bash
init.bat
```

### Linux/Mac
```bash
chmod +x init.sh
./init.sh
```

---

## 🔧 Manual Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

### 3. Database Setup
```bash
mysql -u root -p
CREATE DATABASE plagiarism_checker;
USE plagiarism_checker;
source ../backend/database/schema.sql;
```

---

## 📊 Access Points

| Role | URL | Email | Password |
|------|-----|-------|----------|
| Admin | http://localhost:3000/admin/dashboard | admin@test.com | password123 |
| Customer | http://localhost:3000/customer/dashboard | customer@test.com | password123 |
| Checker | http://localhost:3000/checker/dashboard | checker@test.com | password123 |

---

## 📝 Key Files to Modify

### Configuration
- `/backend/.env` - Database & JWT settings
- `/frontend/.env` - API URL

### Customization
- `/frontend/src/pages/Home.js` - Landing page
- `/frontend/src/styles/index.css` - Brand colors
- `/backend/src/utils/constants.js` - App constants

---

## 🔌 API Base URL

```
http://localhost:5000/api
```

### Example Requests

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## 📚 Documentation Files

| Document | Purpose |
|----------|---------|
| README.md | Full feature list & setup |
| SETUP.md | Quick start guide |
| API_DOCUMENTATION.md | All endpoints with examples |
| DEPLOYMENT.md | Production deployment |
| ARCHITECTURE.md | System design |
| PROJECT_SUMMARY.md | Complete overview |
| FILE_LISTING.md | File structure |
| CHANGELOG.md | Version history |
| CONTRIBUTING.md | Contribution guidelines |

---

## 🛠️ Development Commands

### Backend
```bash
npm run dev          # Start with nodemon (development)
npm start            # Start production server
npm test             # Run tests
```

### Frontend
```bash
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests
```

---

## 🗄️ Database Tables

1. **users** - User accounts
2. **files** - Uploaded documents
3. **reports** - AI/plagiarism reports
4. **notifications** - User notifications
5. **comments** - File comments
6. **activity_logs** - System logs

---

## 🔐 Default Test Accounts

After running setup scripts, use these to test:

**Admin:**
- Email: admin@test.com
- Password: password123

**Customer:**
- Email: customer@test.com
- Password: password123

**Checker:**
- Email: checker@test.com
- Password: password123

---

## 📦 Key Dependencies

### Backend
- express (web framework)
- mysql2 (database)
- jsonwebtoken (auth)
- multer (file upload)
- nodemailer (email)
- bcryptjs (password)

### Frontend
- react (UI)
- react-router-dom (navigation)
- axios (HTTP)
- recharts (charts)
- react-icons (icons)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 3000
npx kill-port 3000
```

### Database Connection Failed
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists

### Email Not Sending
- Use Gmail App Password (not regular password)
- Check EMAIL_HOST, EMAIL_PORT settings
- Verify credentials in `.env`

### File Upload Issues
- Check `/backend/src/uploads` directory exists
- Verify file permissions
- Check MAX_FILE_SIZE setting

---

## 📈 Next Steps After Setup

1. **Test workflow**
   - Register as customer
   - Upload a file
   - Accept as checker
   - Upload reports
   - Download from customer

2. **Customize**
   - Update colors/branding
   - Add company logo
   - Modify email templates
   - Add custom features

3. **Deploy**
   - Follow DEPLOYMENT.md
   - Choose hosting platform
   - Setup SSL/HTTPS
   - Configure domain

4. **Integrate**
   - Connect to AI/plagiarism APIs
   - Setup payment system
   - Add analytics
   - Implement webhooks

---

## 💡 Pro Tips

1. **Use Postman** for API testing
2. **Check logs** for debugging: `backend/logs/`
3. **Monitor** database with MySQL Workbench
4. **Use PM2** for production: `pm2 start src/server.js`
5. **Enable Git** for version control: `git init`

---

## 📞 Support Resources

- **Official Docs**: React, Express, MySQL
- **GitHub Issues**: Report bugs
- **Stack Overflow**: Community help
- **Project Docs**: See `/docs` folder

---

## ✅ Checklist

- [ ] Installed Node.js and npm
- [ ] Installed MySQL
- [ ] Cloned/extracted project
- [ ] Ran init script
- [ ] Updated .env files
- [ ] Created database
- [ ] Started backend (npm run dev)
- [ ] Started frontend (npm start)
- [ ] Tested login
- [ ] Uploaded test file
- [ ] Accepted file as checker
- [ ] Viewed dashboard stats

---

## 🎯 Development Workflow

```
1. Update code
   ↓
2. Backend reloads (nodemon)
   ↓
3. Frontend reloads (hot reload)
   ↓
4. Test in browser
   ↓
5. Check browser console
   ↓
6. Review backend logs
   ↓
7. Commit changes
```

---

## 📋 Key URLs

| Page | URL |
|------|-----|
| Home | http://localhost:3000/ |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Pricing | http://localhost:3000/pricing |
| Contact | http://localhost:3000/contact |
| API Docs | See API_DOCUMENTATION.md |
| Admin Panel | http://localhost:3000/admin/dashboard |

---

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: January 2024

For detailed information, see the documentation files!
