## Quick Start Guide

### Setup Instructions

#### 1. Database Setup
```bash
# Create database and import schema
mysql -u root -p < backend/database/schema.sql
```

#### 2. Backend Installation
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

Backend runs on: `http://localhost:5000`

#### 3. Frontend Installation
```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

### Default Test Accounts

After running the setup, you can create test accounts:

**Admin Account:**
- Email: admin@test.com
- Password: password123
- Role: admin

**Customer Account:**
- Email: customer@test.com
- Password: password123
- Role: customer

**Checker Account:**
- Email: checker@test.com
- Password: password123
- Role: checker

### API Testing

Use Postman or curl to test endpoints:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"password123"}'

# Upload file (requires token)
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "service_type=both"
```

### Troubleshooting

**Database Connection Error:**
- Ensure MySQL is running
- Check database credentials in .env
- Verify database exists

**File Upload Issues:**
- Ensure uploads directory exists
- Check file permissions
- Verify file size limits

**Email Not Sending:**
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" or use App Password
- Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

### Features to Test

1. **Customer Workflow:**
   - Register → Upload file → View status → Download report

2. **Checker Workflow:**
   - View pending files → Accept job → Download file → Upload reports → Mark completed

3. **Admin Workflow:**
   - View all users → Manage status → View statistics

### Performance Tips

- Use database indexes for better query performance
- Implement caching for frequently accessed data
- Use pagination for large data sets
- Optimize file upload size limits
- Monitor database connections

### Security Reminders

- Never commit .env file
- Use strong JWT_SECRET
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

### Support Resources

- Documentation: See README.md
- Database Schema: backend/database/schema.sql
- API Endpoints: README.md
- Environment Setup: .env.example files
