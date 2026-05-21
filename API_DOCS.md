# API Documentation - Phase 1

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

### POST /auth/signup
Register a new user (teacher or student)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "teacher" // or "student"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "teacher"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login
Login and get JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "teacher"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/profile
Get current user profile (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "teacher"
  }
}
```

---

## Lecture Endpoints

### POST /lectures/upload
Upload a new lecture (teacher only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `video` (file, required): MP4 video file
- `title` (string, required): Lecture title
- `courseId` (number, required): Associated course ID
- `description` (string, optional): Lecture description

**Response (201):**
```json
{
  "message": "Lecture uploaded successfully",
  "lecture": {
    "id": 1,
    "title": "Introduction to AI",
    "videoUrl": "https://ailearn-mate-videos.s3.ap-south-1.amazonaws.com/...",
    "uploadedAt": "2026-05-21T10:30:00Z"
  }
}
```

### GET /lectures
Get all lectures (filtered by user role)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `courseId` (optional): Filter by course ID

**Response (200):**
```json
{
  "lectures": [
    {
      "id": 1,
      "title": "Introduction to AI",
      "description": "Basic AI concepts",
      "video_url": "https://...",
      "course_id": 1,
      "teacher_id": 1,
      "duration": 3600,
      "uploaded_at": "2026-05-21T10:30:00Z"
    }
  ]
}
```

### GET /lectures/:id
Get specific lecture details

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "lecture": {
    "id": 1,
    "title": "Introduction to AI",
    "description": "Basic AI concepts",
    "video_url": "https://...",
    "course_id": 1,
    "teacher_id": 1,
    "duration": 3600,
    "uploaded_at": "2026-05-21T10:30:00Z",
    "transcript": {
      "lectureId": 1,
      "text": "Today we'll discuss...",
      "generatedAt": "2026-05-21T10:35:00Z"
    }
  }
}
```

### DELETE /lectures/:id
Delete a lecture (teacher only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Lecture deleted successfully"
}
```

### POST /lectures/:id/transcribe
Generate transcript for a lecture

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "transcript": {
    "lectureId": 1,
    "text": "Today we'll discuss artificial intelligence and machine learning...",
    "generatedAt": "2026-05-21T10:35:00Z",
    "accuracy": 0.95
  },
  "fromCache": false
}
```

---

## Student Endpoints

### POST /students/enroll
Enroll a student in a course

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "courseId": 1
}
```

**Response (201):**
```json
{
  "message": "Enrolled successfully",
  "enrollmentId": 5
}
```

### GET /students/progress/:courseId
Get student's learning progress in a course

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "progress": {
    "total_lectures": 10,
    "watched_lectures": 3,
    "progress_percentage": 30.00
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Title and courseId are required"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Lecture not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire in 7 days (configured by JWT_EXPIRE).

---

## Rate Limiting & Pagination

Coming in Phase 2:
- Rate limiting per user
- Pagination for lecture lists
- Sorting and filtering options
