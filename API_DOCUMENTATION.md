# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register
**POST** `/auth/register`

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer",
  "company": "Tech Corp",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Get Current User
**GET** `/auth/me`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "status": "active",
    "phone": "+1234567890",
    "company": "Tech Corp",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update Profile
**PUT** `/auth/profile`

Headers: `Authorization: Bearer <token>`

Request body:
```json
{
  "name": "John Updated",
  "phone": "+0987654321",
  "company": "New Corp"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## Files Endpoints

### Upload File (Customer)
**POST** `/files/upload`

Headers: `Authorization: Bearer <token>`

Multipart form data:
- `file` (file) - Document to upload
- `title` (string) - Document title
- `description` (string, optional) - Description
- `service_type` (string) - 'ai_detection', 'plagiarism_check', or 'both'

Response:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileId": 123,
  "filename": "unique_filename.pdf"
}
```

### Get Pending Files (Checker)
**GET** `/files/pending`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "files": [
    {
      "id": 123,
      "title": "Document Title",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "service_type": "both",
      "upload_date": "2024-01-15T10:30:00Z",
      "status": "pending"
    }
  ]
}
```

### Accept File (Checker)
**POST** `/files/:id/accept`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "message": "File accepted successfully",
  "file": {
    "id": 123,
    "status": "accepted"
  }
}
```

### Get Accepted Files (Checker)
**GET** `/files/accepted`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "files": [
    {
      "id": 123,
      "title": "Document Title",
      "customer_name": "John Doe",
      "status": "accepted",
      "accepted_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Get Customer Files
**GET** `/files/my-files`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "files": [
    {
      "id": 123,
      "title": "Document Title",
      "service_type": "both",
      "status": "completed",
      "upload_date": "2024-01-15T10:30:00Z",
      "ai_percentage": 25,
      "plagiarism_percentage": 10
    }
  ]
}
```

### Get File Details
**GET** `/files/:id`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "file": {
    "id": 123,
    "title": "Document Title",
    "description": "Description here",
    "customer_name": "John Doe",
    "checker_name": "Jane Smith",
    "status": "completed",
    "service_type": "both",
    "upload_date": "2024-01-15T10:30:00Z"
  }
}
```

### Download File
**GET** `/files/:id/download`

Headers: `Authorization: Bearer <token>`

Response: File blob (binary)

### Delete File
**DELETE** `/files/:id`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Reports Endpoints

### Upload Report (Checker)
**POST** `/reports/upload`

Headers: `Authorization: Bearer <token>`

Multipart form data:
- `file_id` (number) - File ID
- `ai_report` (file, optional) - AI report file
- `plagiarism_report` (file, optional) - Plagiarism report file
- `ai_percentage` (number, optional) - AI detection percentage
- `plagiarism_percentage` (number, optional) - Plagiarism percentage
- `remarks` (string, optional) - Additional remarks

Response:
```json
{
  "success": true,
  "message": "Report uploaded successfully"
}
```

### Mark Completed
**POST** `/reports/mark-completed`

Headers: `Authorization: Bearer <token>`

Request body:
```json
{
  "file_id": 123
}
```

Response:
```json
{
  "success": true,
  "message": "File marked as completed"
}
```

### Get Report
**GET** `/reports/:file_id`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "report": {
    "id": 456,
    "file_id": 123,
    "ai_report": "Report content...",
    "ai_percentage": 25,
    "plagiarism_report": "Report content...",
    "plagiarism_percentage": 10,
    "remarks": "Additional notes...",
    "uploaded_at": "2024-01-15T12:00:00Z"
  }
}
```

### Add Comment
**POST** `/reports/comment`

Headers: `Authorization: Bearer <token>`

Request body:
```json
{
  "file_id": 123,
  "comment": "Your comment here"
}
```

Response:
```json
{
  "success": true,
  "message": "Comment added successfully"
}
```

### Get Comments
**GET** `/reports/:file_id/comments`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "comments": [
    {
      "id": 1,
      "user_id": 1,
      "name": "John Doe",
      "role": "customer",
      "comment": "Comment text",
      "created_at": "2024-01-15T12:00:00Z"
    }
  ]
}
```

---

## Admin Endpoints

### Get All Users
**GET** `/admin/users?role=customer&status=active&page=1&limit=10`

Headers: `Authorization: Bearer <token>` (Admin only)

Query parameters:
- `role` (string, optional) - Filter by role
- `status` (string, optional) - Filter by status
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

Response:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "status": "active",
      "phone": "+1234567890",
      "company": "Tech Corp",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "page": 1,
  "limit": 10
}
```

### Update User Status
**PUT** `/admin/users/status`

Headers: `Authorization: Bearer <token>` (Admin only)

Request body:
```json
{
  "user_id": 1,
  "status": "suspended"
}
```

Response:
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

### Get Admin Statistics
**GET** `/admin/stats`

Headers: `Authorization: Bearer <token>` (Admin only)

Response:
```json
{
  "success": true,
  "stats": {
    "users": {
      "admin": 2,
      "customer": 10,
      "checker": 5
    },
    "files": {
      "total": 50,
      "pending": 5,
      "accepted": 10,
      "in_progress": 15,
      "completed": 20
    },
    "checkerPerformance": [
      {
        "id": 1,
        "name": "Jane Smith",
        "total_files": 20,
        "completed_files": 18
      }
    ]
  }
}
```

---

## Notifications Endpoints

### Get Notifications
**GET** `/notifications?page=1&limit=20&is_read=false`

Headers: `Authorization: Bearer <token>`

Query parameters:
- `page` (number) - Page number
- `limit` (number) - Items per page
- `is_read` (boolean, optional) - Filter by read status

Response:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "file_id": 123,
      "title": "File Accepted",
      "message": "Your file has been accepted",
      "type": "success",
      "is_read": false,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "page": 1,
  "limit": 20
}
```

### Get Unread Count
**GET** `/notifications/unread-count`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "unreadCount": 5
}
```

### Mark as Read
**PUT** `/notifications/:id/read`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All as Read
**PUT** `/notifications/mark-all-read`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address

---

## CORS

CORS is enabled for all origins. In production, configure to specific domains only.

---

## Versioning

Current API version: v1
Future updates will maintain backward compatibility or increment version number.
