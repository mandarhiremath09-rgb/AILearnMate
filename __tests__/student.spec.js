const request = require('supertest');
const app = require('../../server');
const pool = require('../../config/database');

describe('Student Endpoints', () => {
  let studentToken;
  let studentId;
  let teacherToken;
  let teacherId;
  let courseId;

  beforeAll(async () => {
    // Create teacher
    const teacherRes = await request(app).post('/api/auth/signup').send({
      email: 'teacher@student.com',
      password: 'password123',
      name: 'Student Teacher',
      role: 'teacher',
    });
    teacherToken = teacherRes.body.token;
    teacherId = teacherRes.body.user.id;

    // Create student
    const studentRes = await request(app).post('/api/auth/signup').send({
      email: 'student@student.com',
      password: 'password123',
      name: 'Student User',
      role: 'student',
    });
    studentToken = studentRes.body.token;
    studentId = studentRes.body.user.id;

    // Create course
    const courseRes = await pool.query(
      'INSERT INTO courses (teacher_id, title, description) VALUES ($1, $2, $3) RETURNING id',
      [teacherId, 'Student Course', 'For student tests']
    );
    courseId = courseRes.rows[0].id;
  });

  describe('POST /api/students/enroll', () => {
    it('should enroll student in course', async () => {
      const res = await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Enrolled successfully');
      expect(res.body.enrollmentId).toBeDefined();
    });

    it('should return 400 if courseId is missing', async () => {
      const res = await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('courseId is required');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/students/enroll')
        .send({ courseId });

      expect(res.status).toBe(401);
    });

    it('should return 403 if teacher tries to enroll', async () => {
      const res = await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ courseId });

      expect(res.status).toBe(403);
    });

    it('should return 409 if already enrolled', async () => {
      // First enrollment
      await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId });

      // Second enrollment (should fail)
      const res = await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Already enrolled in this course');
    });
  });

  describe('GET /api/students/progress/:courseId', () => {
    beforeEach(async () => {
      // Enroll student in course
      await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId });

      // Create lectures
      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, teacherId, 'Lecture 1', 'First', 'https://s3.url/1.mp4', 3600]
      );

      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, teacherId, 'Lecture 2', 'Second', 'https://s3.url/2.mp4', 3600]
      );

      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, teacherId, 'Lecture 3', 'Third', 'https://s3.url/3.mp4', 3600]
      );

      // Mark one lecture as watched
      const lecture1 = await pool.query(
        'SELECT id FROM lectures WHERE course_id = $1 LIMIT 1',
        [courseId]
      );

      await pool.query(
        'INSERT INTO lecture_views (student_id, lecture_id, watch_time_seconds) VALUES ($1, $2, $3)',
        [studentId, lecture1.rows[0].id, 3600]
      );
    });

    it('should get student progress in course', async () => {
      const res = await request(app)
        .get(`/api/students/progress/${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toBeDefined();
      expect(res.body.progress.total_lectures).toBe(3);
      expect(res.body.progress.watched_lectures).toBe(1);
      expect(res.body.progress.progress_percentage).toBe(33.33);
    });

    it('should return 0% progress for no watched lectures', async () => {
      // Create a new course
      const newCourseRes = await pool.query(
        'INSERT INTO courses (teacher_id, title, description) VALUES ($1, $2, $3) RETURNING id',
        [teacherId, 'New Course', 'New course']
      );
      const newCourseId = newCourseRes.rows[0].id;

      // Enroll student
      await request(app)
        .post('/api/students/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: newCourseId });

      // Create a lecture but don't watch
      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [newCourseId, teacherId, 'New Lecture', 'New', 'https://s3.url/new.mp4', 3600]
      );

      const res = await request(app)
        .get(`/api/students/progress/${newCourseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.progress_percentage).toBe(0);
    });

    it('should return 100% progress when all lectures watched', async () => {
      // Watch all lectures
      const lectures = await pool.query(
        'SELECT id FROM lectures WHERE course_id = $1',
        [courseId]
      );

      for (const lecture of lectures.rows) {
        await pool.query(
          'INSERT INTO lecture_views (student_id, lecture_id, watch_time_seconds) VALUES ($1, $2, $3) ON CONFLICT (student_id, lecture_id) DO NOTHING',
          [studentId, lecture.id, 3600]
        );
      }

      const res = await request(app)
        .get(`/api/students/progress/${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.progress_percentage).toBe(100);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get(`/api/students/progress/${courseId}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 if teacher tries to access', async () => {
      const res = await request(app)
        .get(`/api/students/progress/${courseId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
