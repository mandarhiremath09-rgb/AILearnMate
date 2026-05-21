-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student')),
  profile_pic_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  duration INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id SERIAL PRIMARY KEY,
  lecture_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lecture_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Student enrollments
CREATE TABLE IF NOT EXISTS student_enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lecture views tracking
CREATE TABLE IF NOT EXISTS lecture_views (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  lecture_id INTEGER NOT NULL,
  watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(student_id, lecture_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_teacher ON lectures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON student_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_views_student ON lecture_views(student_id);
