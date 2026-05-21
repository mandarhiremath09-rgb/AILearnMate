# AILearnMate - Phase 1 MVP

AI-powered Learning Management System with video lectures, transcription, and student progress tracking.

## Phase 1 Features

✅ **User Authentication**
- Teacher and Student signup/login
- JWT-based authentication
- Role-based access control

✅ **Video Lecture Management**
- Teachers upload lectures to AWS S3
- Secure video storage
- Lecture metadata tracking

✅ **Transcription**
- Auto-generate transcripts using OpenAI Whisper
- Redis caching for performance
- Transcript storage

✅ **Student Dashboard**
- Enroll in courses
- Access lectures
- Track learning progress

## Project Structure

```
AILearnMate/
├── config/           # Configuration files (DB, Redis, S3)
├── controllers/      # Business logic
├── routes/          # API endpoints
├── middleware/      # Auth, error handling
├── utils/           # Logger, helpers
├── database/        # Schema and migrations
├── server.js        # Main entry point
├── package.json
├── .env.example
└── docker-compose.yml
```

## Setup Instructions

### Prerequisites
- Node.js >= 16
- PostgreSQL >= 12
- Redis >= 6
- AWS S3 bucket
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mandarhiremath09-rgb/AILearnMate.git
cd AILearnMate
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Docker services**
```bash
docker-compose up -d
```

4. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Initialize database**
```bash
psql -U postgres -d ailearnemate -f database/schema.sql
```

6. **Start the server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Lectures
- `POST /api/lectures/upload` - Upload lecture (teacher only)
- `GET /api/lectures` - Get all lectures
- `GET /api/lectures/:id` - Get lecture details
- `DELETE /api/lectures/:id` - Delete lecture (teacher only)
- `POST /api/lectures/:id/transcribe` - Generate transcript

### Students
- `POST /api/students/enroll` - Enroll in course
- `GET /api/students/progress/:courseId` - Get progress

## Example Requests

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "John Teacher",
    "role": "teacher"
  }'
```

### Upload Lecture
```bash
curl -X POST http://localhost:5000/api/lectures/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@lecture.mp4" \
  -F "title=Introduction to AI" \
  -F "courseId=1" \
  -F "description=Basic AI concepts"
```

### Generate Transcript
```bash
curl -X POST http://localhost:5000/api/lectures/1/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Phase 2 Features (Coming Soon)

- [ ] Quiz generation from transcripts
- [ ] Study material summarization
- [ ] Personalized recommendations
- [ ] Student uploads (video/PDF/YouTube)
- [ ] Teacher evaluation dashboard

## Phase 3 Features (Coming Soon)

- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Real-time notifications
- [ ] Performance optimization

## Environment Variables

See `.env.example` for all required variables:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ailearnemate
DB_USER=postgres
AWS_S3_BUCKET=ailearn-mate-videos
OPENAI_API_KEY=your_key
JWT_SECRET=your_secret
```

## Database Schema

### Users Table
- id, email, password_hash, name, role, profile_pic_url, bio

### Courses Table
- id, teacher_id, title, description

### Lectures Table
- id, course_id, teacher_id, title, description, video_url, duration

### Transcripts Table
- id, lecture_id, content

### Student Enrollments
- id, student_id, course_id

### Lecture Views
- id, student_id, lecture_id, watch_time_seconds

## Troubleshooting

**Database connection error:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"
```

**Redis connection error:**
```bash
# Check if Redis is running
redis-cli ping
```

**S3 upload fails:**
- Verify AWS credentials in `.env`
- Check S3 bucket permissions
- Ensure IAM user has S3 access

## Contributing

Contributions are welcome! Please create a branch and submit a pull request.

## License

MIT

## Next Steps

1. Set up local development environment
2. Configure AWS S3 bucket
3. Add OpenAI API key
4. Run database migrations
5. Start server and test endpoints

For Phase 2 and 3 development, see the implementation plan.
