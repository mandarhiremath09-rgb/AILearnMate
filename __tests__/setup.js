const pool = require('../../config/database');

// Setup test database
beforeAll(async () => {
  try {
    // Create schema if not exists
    await pool.query(`
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

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      );

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

      CREATE TABLE IF NOT EXISTS transcripts (
        id SERIAL PRIMARY KEY,
        lecture_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lecture_id),
        FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS student_enrollments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

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
    `);
    console.log('✅ Test database schema created');
  } catch (err) {
    console.error('Setup error:', err);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS lecture_views CASCADE');
    await pool.query('DROP TABLE IF EXISTS student_enrollments CASCADE');
    await pool.query('DROP TABLE IF EXISTS transcripts CASCADE');
    await pool.query('DROP TABLE IF EXISTS lectures CASCADE');
    await pool.query('DROP TABLE IF EXISTS courses CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.end();
    console.log('✅ Test database cleaned up');
  } catch (err) {
    console.error('Cleanup error:', err);
  }
});

// Helper to clear tables between tests
global.clearDatabase = async () => {
  try {
    await pool.query('TRUNCATE TABLE lecture_views CASCADE');
    await pool.query('TRUNCATE TABLE student_enrollments CASCADE');
    await pool.query('TRUNCATE TABLE transcripts CASCADE');
    await pool.query('TRUNCATE TABLE lectures CASCADE');
    await pool.query('TRUNCATE TABLE courses CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');
  } catch (err) {
    console.error('Clear database error:', err);
  }
};
