# Phase 1 - Getting Started Guide

## What's Been Built

✅ **Backend API** (Node.js + Express)
- User authentication (Teacher/Student)
- Lecture upload to AWS S3
- Transcription placeholder (ready for Whisper API)
- Student enrollment and progress tracking
- Role-based access control

✅ **Database** (PostgreSQL)
- Users, Courses, Lectures, Transcripts
- Student enrollments and lecture views
- Indexes for performance

✅ **Infrastructure**
- Docker Compose for local dev
- Redis for caching
- Environment configuration

## Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Install required tools
- Node.js (https://nodejs.org/) - v16 or higher
- Docker Desktop (https://www.docker.com/products/docker-desktop)
- Git (https://git-scm.com/)
```

### 2. Clone & Setup
```bash
# Clone repository
git clone https://github.com/mandarhiremath09-rgb/AILearnMate.git
cd AILearnMate

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configure Credentials

Edit `.env` file with your credentials:

```env
# Database (Docker provides these)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ailearnemate
DB_USER=postgres
DB_PASSWORD=password

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=ailearn-mate-videos
AWS_REGION=ap-south-1

# OpenAI (for Whisper transcription)
OPENAI_API_KEY=sk-...

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_key_change_this_in_production
```

### 4. Start Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 5. Initialize Database
```bash
npm run migrate
```

You should see: ✅ Database schema created successfully

### 6. Start Development Server
```bash
npm run dev
```

You should see:
```
Server running on port 5000
Connected to Redis
```

## Testing the API

### Test 1: Create a Teacher Account
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

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "teacher@example.com",
    "name": "John Teacher",
    "role": "teacher"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Save the token!

### Test 2: Create a Student Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Jane Student",
    "role": "student"
  }'
```

### Test 3: Get Your Profile
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <YOUR_TEACHER_TOKEN>"
```

### Test 4: Create a Course (coming in Phase 2)
Currently, courseId is required for lectures. For now, manually create a course in the database:

```bash
# Connect to PostgreSQL
docker exec -it ailearnemate-postgres-1 psql -U postgres -d ailearnemate

# Inside psql:
INSERT INTO courses (teacher_id, title, description) 
VALUES (1, 'AI Fundamentals', 'Introduction to AI');

# Then select all courses to see the IDs:
SELECT * FROM courses;
```

### Test 5: Upload a Lecture (Teacher Only)

First, get a sample video or create a small one:

```bash
# Create a small test video (15 seconds)
ffmpeg -f lavfi -i testsrc=duration=15:size=320x240:rate=1 \
  -f lavfi -i sine=frequency=1000:duration=15 \
  -pix_fmt yuv420p test-video.mp4
```

Then upload:
```bash
curl -X POST http://localhost:5000/api/lectures/upload \
  -H "Authorization: Bearer <YOUR_TEACHER_TOKEN>" \
  -F "video=@test-video.mp4" \
  -F "title=Introduction to AI" \
  -F "courseId=1" \
  -F "description=Basic AI concepts"
```

### Test 6: Get All Lectures
```bash
curl -X GET http://localhost:5000/api/lectures \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Test 7: Generate Transcript
```bash
curl -X POST http://localhost:5000/api/lectures/1/transcribe \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## Project Structure

```
AILearnMate/
├── config/              # Configuration modules
│   ├── database.js      # PostgreSQL connection
│   ├── redis.js         # Redis cache client
│   └── s3.js            # AWS S3 configuration
├── controllers/         # Business logic
│   ├── auth.controller.js
│   ├── lecture.controller.js
│   └── student.controller.js
├── routes/             # API endpoints
│   ├── auth.routes.js
│   ├── lecture.routes.js
│   └── student.routes.js
├── middleware/         # Express middleware
│   ├── auth.js         # JWT authentication
│   └── errorHandler.js # Error handling
├── utils/              # Utility functions
│   └── logger.js       # Winston logger
├── database/           # Database scripts
│   └── schema.sql      # Database schema
├── scripts/            # CLI scripts
│   └── migrate.js      # Database migration
├── server.js           # Main entry point
├── package.json        # Dependencies
├── .env.example        # Environment template
├── docker-compose.yml  # Docker services
└── README.md           # Documentation
```

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if Docker container is running
docker-compose ps

# Restart if needed
docker-compose restart postgres

# Test connection manually
psql -h localhost -U postgres -d ailearnemate -c "SELECT 1"
```

### Issue: "Redis connection refused"

**Solution:**
```bash
# Check Redis status
docker-compose logs redis

# Restart Redis
docker-compose restart redis

# Test connection
redis-cli ping
```

### Issue: "S3 upload fails with 403"

**Solution:**
- Check AWS credentials in `.env`
- Verify bucket exists: `aws s3 ls --profile your-profile`
- Ensure IAM user has `s3:GetObject`, `s3:PutObject` permissions

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use a different port
PORT=5001 npm run dev
```

## Next Steps for Phase 2

1. **Build frontend** (React)
   - Login/Signup UI
   - Video player
   - Lecture upload form
   - Student dashboard

2. **AI Features**
   - Integrate Whisper API for real transcription
   - GPT-3.5 for summarization
   - Quiz generation
   - Recommendations

3. **Database**
   - Add Courses CRUD endpoints
   - Add Summaries table
   - Add Quizzes table

## Performance Tips

- Redis caches transcripts (7 days)
- Database queries are indexed
- S3 signed URLs for secure video access
- Use CDN for video delivery (Phase 3)

## Security Notes

- Passwords hashed with bcryptjs
- JWT tokens expire in 7 days
- S3 bucket is private (no public access)
- Role-based access control (RBAC)
- Input validation with Joi

## Monitoring

Check logs:
```bash
# Server logs
tail -f combined.log

# Error logs
tail -f error.log

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Useful Commands

```bash
# Start dev server
npm run dev

# Run migrations
npm run migrate

# Run tests (when added)
npm test

# Lint code
npm run lint

# Stop all services
docker-compose down

# View database
docker exec -it ailearnemate-postgres-1 psql -U postgres -d ailearnemate
```

## Need Help?

- Check `API_DOCS.md` for endpoint details
- Review the README.md for overview
- Check error logs in `error.log`
- Verify `.env` configuration

## Success Checklist

- [ ] Docker containers running
- [ ] Database schema created
- [ ] Server started on port 5000
- [ ] Can create user account
- [ ] Can login and get token
- [ ] Can upload lecture (with video file)
- [ ] Can get lectures list
- [ ] Can generate transcript

Once everything works, you're ready for Phase 2! 🚀
