# Plagiarism Checker - AI & Plagiarism Detection Service

A comprehensive web application for document analysis, AI detection, and plagiarism checking with role-based access control for customers, checkers, and administrators.

## Features

### For Customers
- Register and manage profile
- Upload documents for checking
- Select service type (AI Detection, Plagiarism Check, or Both)
- Track document status in real-time
- Download detailed reports
- View upload history and statistics

### For Checkers
- View available documents for checking
- Accept checking jobs
- Download customer documents
- Upload AI and plagiarism reports
- Add comments and remarks
- Track completed jobs and performance metrics

### For Administrators
- View and manage all users
- Monitor all uploaded files and reports
- Suspend or activate users
- View system statistics and analytics
- Monitor checker performance
- Generate reports

## Technology Stack

- **Frontend**: React.js, React Router, Recharts for analytics, Axios for API calls
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email Notifications**: Nodemailer
- **Styling**: CSS3 with responsive design

## Project Structure

```
Turnitin/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/      # API logic (auth, files, reports, admin, notifications)
│   │   ├── middleware/       # Authentication, file upload, validation
│   │   ├── routes/          # API endpoints
│   │   ├── utils/           # Helper functions (JWT, email, etc.)
│   │   ├── uploads/         # Uploaded files storage
│   │   └── server.js        # Express server entry point
│   ├── database/
│   │   └── schema.sql       # MySQL database schema
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components (Navbar, PrivateRoute)
│   │   ├── pages/          # Page components organized by role
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Pricing.js
│   │   │   ├── Contact.js
│   │   │   ├── customer/   # Customer pages
│   │   │   ├── checker/    # Checker pages
│   │   │   └── admin/      # Admin pages
│   │   ├── utils/          # API utilities
│   │   ├── styles/         # CSS stylesheets
│   │   ├── App.js          # Main app component
│   │   └── index.js        # React entry point
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=plagiarism_checker
DB_PORT=3306
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

5. Create MySQL database:
```sql
CREATE DATABASE plagiarism_checker;
USE plagiarism_checker;
-- Import schema from database/schema.sql
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Database Schema

### Tables

- **users**: Stores user information (customers, checkers, admins)
- **files**: Stores uploaded documents and their status
- **reports**: Stores AI and plagiarism reports
- **notifications**: User notifications
- **activity_logs**: System activity tracking
- **comments**: Comments on files

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Files
- `POST /api/files/upload` - Upload document (Customer)
- `GET /api/files/pending` - Get pending files (Checker)
- `POST /api/files/:id/accept` - Accept checking job (Checker)
- `GET /api/files/accepted` - Get accepted jobs (Checker)
- `GET /api/files/my-files` - Get customer's files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Reports
- `POST /api/reports/upload` - Upload report (Checker)
- `POST /api/reports/mark-completed` - Mark file as completed
- `GET /api/reports/:file_id` - Get report
- `POST /api/reports/comment` - Add comment
- `GET /api/reports/:file_id/comments` - Get comments

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/status` - Update user status
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/customer-stats` - Get customer statistics
- `GET /api/admin/checker-stats` - Get checker statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

## User Roles & Permissions

### Customer
- Upload documents
- View their files and reports
- Manage profile
- View statistics

### Checker
- View pending documents
- Accept checking jobs
- Download documents
- Upload reports
- Add comments
- Mark tasks as completed

### Admin
- View all users and manage their status
- View all files and reports
- Monitor system statistics
- View checker performance
- Manage the system

## Key Features Implementation

### File Status Management
- **Pending**: Initial status when uploaded
- **Accepted**: When a checker accepts the job
- **In Progress**: When checker is working on it
- **Completed**: When reports are uploaded

### Security Features
- JWT authentication for all protected routes
- Password hashing with bcryptjs
- Role-based access control
- Database transactions for race condition prevention
- File upload validation

### Real-time Notifications
- Email notifications on file acceptance
- Email notifications on completion
- In-app notification system
- Unread notification counter

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=plagiarism_checker
DB_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=secret_key
JWT_EXPIRE=7d
MAX_FILE_SIZE=52428800
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password
APP_URL=http://localhost:3000
API_URL=http://localhost:5000
```

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

Backend:
```bash
npm run build
```

Frontend:
```bash
npm run build
```

## Deployment

### Backend Deployment (Using Node.js)
1. Install production dependencies: `npm install --production`
2. Set environment variables in production
3. Run: `npm start`

### Frontend Deployment (Using static hosting)
1. Build the app: `npm run build`
2. Deploy the `build` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push
5. Create a pull request

## License

MIT License

## Support

For support, email support@plagiarismchecker.com or create an issue in the repository.

## Future Enhancements

- Dark mode toggle
- Advanced search and filtering
- Batch file uploads
- API rate limiting
- WebSocket real-time updates
- Two-factor authentication
- Payment integration
- Advanced analytics dashboard
- Export reports in multiple formats
- Document comparison feature
