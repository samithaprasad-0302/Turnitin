# System Architecture

## Overview
The AI & Plagiarism Checking Service is a three-tier web application with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                     (React.js Frontend)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Customer │  │  Checker │  │  Admin   │  │  Public  │        │
│  │Pages     │  │  Pages   │  │ Pages    │  │  Pages   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP/HTTPS)
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                  (Node.js + Express.js)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Server                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Auth     │  │ Files    │  │ Reports  │              │  │
│  │  │ Routes   │  │ Routes   │  │ Routes   │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Admin    │  │Notif.    │  │ Users    │              │  │
│  │  │ Routes   │  │ Routes   │  │ Routes   │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  │  ┌─────────────────────────────────────────────┐       │  │
│  │  │ Middleware Layer                            │       │  │
│  │  │ • Authentication (JWT)                      │       │  │
│  │  │ • Authorization (Role-based)                │       │  │
│  │  │ • File Upload (Multer)                      │       │  │
│  │  │ • Error Handling                            │       │  │
│  │  │ • Rate Limiting                             │       │  │
│  │  │ • Request Logging                           │       │  │
│  │  └─────────────────────────────────────────────┘       │  │
│  │  ┌─────────────────────────────────────────────┐       │  │
│  │  │ Business Logic Layer                        │       │  │
│  │  │ • Controllers                               │       │  │
│  │  │ • Validation                                │       │  │
│  │  │ • Database Transactions                     │       │  │
│  │  │ • Email Service                             │       │  │
│  │  └─────────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (SQL)
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│                   (MySQL Database)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Users   │  │  Files   │  │ Reports  │  │Notif.    │        │
│  │  Table   │  │  Table   │  │  Table   │  │ Table    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐                                     │
│  │ Comments │  │ Activity │                                     │
│  │  Table   │  │ Logs Tab.│                                     │
│  └──────────┘  └──────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (File I/O)
┌─────────────────────────────────────────────────────────────────┐
│                  FILE STORAGE LAYER                              │
│               (Server Uploads Directory)                         │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Original Files / Reports / Documents                │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (SMTP)
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ • Email Service (Nodemailer)                        │       │
│  │ • Optional: Payment Gateway                         │       │
│  │ • Optional: AI/Plagiarism Check APIs               │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (React.js)
- **Pages**: Home, Login, Register, Pricing, Contact
- **Role-specific Pages**: Customer Dashboard, Checker Dashboard, Admin Dashboard
- **Components**: Navbar, PrivateRoute, Charts, Forms, Tables
- **Utilities**: API calls, Authentication, Helpers
- **Styling**: Responsive CSS with mobile support

### Backend (Node.js + Express)
- **Routes**: Auth, Files, Reports, Admin, Notifications, Users
- **Controllers**: Business logic for each endpoint
- **Middleware**: Authentication, Authorization, File upload, Error handling
- **Models**: Database queries (using raw SQL with mysql2)
- **Utilities**: JWT, Email, Validation, Constants, Logging
- **Database**: MySQL with 6 tables

### Database Schema
- **Users**: User accounts with roles
- **Files**: Uploaded documents with status tracking
- **Reports**: AI and plagiarism check reports
- **Notifications**: User notifications
- **Comments**: Comments on files
- **Activity Logs**: System activity tracking

## Data Flow

### File Upload Flow
```
Customer Upload File
    ↓
Frontend Form Submit
    ↓
Backend File Upload (Multer)
    ↓
Store File + Create DB Entry (Status: Pending)
    ↓
Notify All Checkers
    ↓
File Available for Checkers
```

### File Acceptance Flow
```
Checker View Pending Files
    ↓
Checker Click Accept
    ↓
Update File (Status: Accepted, Assign Checker)
    ↓
Prevent Other Checkers from Accepting (Transaction)
    ↓
Notify Customer
```

### Report Upload Flow
```
Checker Upload Reports
    ↓
Store Report Data
    ↓
Checker Mark Completed
    ↓
Update File Status: Completed
    ↓
Notify Customer
    ↓
Customer Downloads Reports
```

## Security Architecture

```
┌─────────────────────┐
│  Client Request     │
└──────────┬──────────┘
           ↓
    ┌─────────────────┐
    │  CORS Check     │
    └────────┬────────┘
             ↓
    ┌─────────────────┐
    │  Rate Limiting  │
    └────────┬────────┘
             ↓
    ┌──────────────────────┐
    │  JWT Verification    │
    └────────┬─────────────┘
             ↓
    ┌──────────────────────┐
    │  Role Check          │
    └────────┬─────────────┘
             ↓
    ┌──────────────────────┐
    │  Input Validation    │
    └────────┬─────────────┘
             ↓
    ┌──────────────────────┐
    │  Business Logic      │
    └────────┬─────────────┘
             ↓
    ┌──────────────────────┐
    │  Response Sent       │
    └──────────────────────┘
```

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling for efficiency
- Transactions for atomic operations
- Pagination for large datasets

### Frontend Optimization
- Code splitting with React Router
- Lazy loading of components
- Minification and bundling
- Responsive design

### Backend Optimization
- Request compression (gzip)
- Error logging for debugging
- Connection pooling
- Efficient query writing

## Scalability

### Horizontal Scaling
- Multiple backend instances with load balancer
- Database replication and clustering
- CDN for static assets
- File storage on cloud (AWS S3, etc.)

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layer (Redis)
- Use message queues (RabbitMQ) for async tasks

## Deployment Architecture

```
┌────────────────────────────────────┐
│          Load Balancer             │
└────────┬─────────────────┬─────────┘
         ↓                 ↓
    ┌─────────┐       ┌─────────┐
    │Server 1 │       │Server 2 │
    └────┬────┘       └────┬────┘
         │                 │
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │  MySQL Database │
         │   (Primary)     │
         └────────┬────────┘
                  ↓
         ┌─────────────────┐
         │  MySQL Database │
         │   (Replica)     │
         └─────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js | UI Development |
| Frontend | React Router | Navigation |
| Frontend | Recharts | Data Visualization |
| Frontend | Axios | HTTP Client |
| Frontend | CSS3 | Styling |
| Backend | Node.js | Runtime |
| Backend | Express.js | Web Framework |
| Backend | Multer | File Upload |
| Backend | JWT | Authentication |
| Backend | Bcryptjs | Password Hashing |
| Backend | Nodemailer | Email Service |
| Database | MySQL | Data Storage |
| Deployment | Nginx | Reverse Proxy |
| Deployment | PM2 | Process Manager |

## Future Enhancements

1. **Real-time Updates**
   - WebSocket implementation for live notifications
   - Real-time file status updates

2. **Advanced Features**
   - Payment integration (Stripe, PayPal)
   - Batch processing
   - API usage analytics
   - Advanced search and filtering
   - Document versioning

3. **Performance**
   - Redis caching layer
   - Message queue (RabbitMQ)
   - API rate limiting improvements
   - Database query optimization

4. **Security**
   - Two-factor authentication
   - OAuth2 integration
   - SAML support
   - Advanced encryption

5. **Infrastructure**
   - Docker containerization
   - Kubernetes orchestration
   - CI/CD pipeline
   - Automated testing
   - Monitoring and alerting
