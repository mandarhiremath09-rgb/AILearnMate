const pool = require('../../config/database');

// Helper to create a test user
const createUser = async (userData) => {
  const bcrypt = require('bcryptjs');
  const defaultData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'student',
    ...userData,
  };

  const hashedPassword = await bcrypt.hash(defaultData.password, 10);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, name, role`,
    [defaultData.email, hashedPassword, defaultData.name, defaultData.role]
  );

  return result.rows[0];
};

// Helper to create a test course
const createCourse = async (teacherId, courseData = {}) => {
  const defaultData = {
    title: 'Test Course',
    description: 'Test course description',
    ...courseData,
  };

  const result = await pool.query(
    `INSERT INTO courses (teacher_id, title, description) 
     VALUES ($1, $2, $3) 
     RETURNING id, teacher_id, title, description`,
    [teacherId, defaultData.title, defaultData.description]
  );

  return result.rows[0];
};

// Helper to create a test lecture
const createLecture = async (courseId, teacherId, lectureData = {}) => {
  const defaultData = {
    title: 'Test Lecture',
    description: 'Test lecture description',
    video_url: 'https://s3.example.com/test-video.mp4',
    duration: 3600,
    ...lectureData,
  };

  const result = await pool.query(
    `INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, course_id, teacher_id, title, description, video_url, duration`,
    [courseId, teacherId, defaultData.title, defaultData.description, defaultData.video_url, defaultData.duration]
  );

  return result.rows[0];
};

// Helper to generate JWT token
const generateToken = (userId, email, role) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Helper to enroll student in course
const enrollStudent = async (studentId, courseId) => {
  const result = await pool.query(
    `INSERT INTO student_enrollments (student_id, course_id) 
     VALUES ($1, $2) 
     RETURNING id, student_id, course_id`,
    [studentId, courseId]
  );

  return result.rows[0];
};

// Helper to track lecture view
const trackLectureView = async (studentId, lectureId, watchTimeSeconds = 0) => {
  const result = await pool.query(
    `INSERT INTO lecture_views (student_id, lecture_id, watch_time_seconds) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (student_id, lecture_id) 
     DO UPDATE SET watch_time_seconds = $3
     RETURNING id, student_id, lecture_id, watch_time_seconds`,
    [studentId, lectureId, watchTimeSeconds]
  );

  return result.rows[0];
};

module.exports = {
  createUser,
  createCourse,
  createLecture,
  generateToken,
  enrollStudent,
  trackLectureView,
};
