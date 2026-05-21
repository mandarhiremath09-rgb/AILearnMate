const request = require('supertest');
const app = require('../../server');
const pool = require('../../config/database');

describe('Lecture Endpoints', () => {
  let teacherToken;
  let studentToken;
  let courseId;
  let lectureId;

  beforeAll(async () => {
    // Create teacher
    const teacherRes = await request(app).post('/api/auth/signup').send({
      email: 'teacher@lecture.com',
      password: 'password123',
      name: 'Lecture Teacher',
      role: 'teacher',
    });
    teacherToken = teacherRes.body.token;

    // Create student
    const studentRes = await request(app).post('/api/auth/signup').send({
      email: 'student@lecture.com',
      password: 'password123',
      name: 'Lecture Student',
      role: 'student',
    });
    studentToken = studentRes.body.token;

    // Create course manually
    const courseRes = await pool.query(
      'INSERT INTO courses (teacher_id, title, description) VALUES ($1, $2, $3) RETURNING id',
      [teacherRes.body.user.id, 'AI Basics', 'Learn AI fundamentals']
    );
    courseId = courseRes.rows[0].id;
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE lectures CASCADE');
  });

  describe('POST /api/lectures/upload', () => {
    it('should upload lecture as teacher', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('title', 'Introduction to AI')
        .field('courseId', courseId.toString())
        .field('description', 'Basic AI concepts')
        .attach('video', Buffer.from('fake video content'), 'test-video.mp4');

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Lecture uploaded successfully');
      expect(res.body.lecture.title).toBe('Introduction to AI');
      expect(res.body.lecture.videoUrl).toBeDefined();
      lectureId = res.body.lecture.id;
    });

    it('should return 400 if no video file provided', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('title', 'Test Lecture')
        .field('courseId', courseId.toString());

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No video file provided');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('courseId', courseId.toString())
        .attach('video', Buffer.from('fake video'), 'video.mp4');

      expect(res.status).toBe(400);
    });

    it('should return 400 if courseId is missing', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('title', 'Test Lecture')
        .attach('video', Buffer.from('fake video'), 'video.mp4');

      expect(res.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .field('title', 'Test')
        .field('courseId', courseId.toString())
        .attach('video', Buffer.from('fake video'), 'video.mp4');

      expect(res.status).toBe(401);
    });

    it('should return 403 if student tries to upload', async () => {
      const res = await request(app)
        .post('/api/lectures/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Lecture')
        .field('courseId', courseId.toString())
        .attach('video', Buffer.from('fake video'), 'video.mp4');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/lectures', () => {
    beforeEach(async () => {
      const teacherRes = await pool.query('SELECT id FROM users WHERE email = $1', [
        'teacher@lecture.com',
      ]);
      const teacherId = teacherRes.rows[0].id;

      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, teacherId, 'Lecture 1', 'First lecture', 'https://s3.url/video1.mp4', 3600]
      );

      await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6)',
        [courseId, teacherId, 'Lecture 2', 'Second lecture', 'https://s3.url/video2.mp4', 2400]
      );
    });

    it('should get all lectures for authenticated user', async () => {
      const res = await request(app)
        .get('/api/lectures')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lectures).toBeDefined();
      expect(Array.isArray(res.body.lectures)).toBe(true);
    });

    it('should filter lectures by courseId', async () => {
      const res = await request(app)
        .get(`/api/lectures?courseId=${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lectures.length).toBeGreaterThan(0);
      expect(res.body.lectures[0].course_id).toBe(courseId);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/lectures');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/lectures/:id', () => {
    let lectureId;

    beforeEach(async () => {
      const teacherRes = await pool.query('SELECT id FROM users WHERE email = $1', [
        'teacher@lecture.com',
      ]);
      const teacherId = teacherRes.rows[0].id;

      const lectureRes = await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [courseId, teacherId, 'Test Lecture', 'Description', 'https://s3.url/video.mp4', 1800]
      );
      lectureId = lectureRes.rows[0].id;
    });

    it('should get lecture details by id', async () => {
      const res = await request(app)
        .get(`/api/lectures/${lectureId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.lecture.id).toBe(lectureId);
      expect(res.body.lecture.title).toBe('Test Lecture');
    });

    it('should return 404 for non-existent lecture', async () => {
      const res = await request(app)
        .get('/api/lectures/99999')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Lecture not found');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get(`/api/lectures/${lectureId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/lectures/:id', () => {
    let lectureId;

    beforeEach(async () => {
      const teacherRes = await pool.query('SELECT id FROM users WHERE email = $1', [
        'teacher@lecture.com',
      ]);
      const teacherId = teacherRes.rows[0].id;

      const lectureRes = await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [courseId, teacherId, 'To Delete', 'Description', 'https://s3.url/video.mp4', 1800]
      );
      lectureId = lectureRes.rows[0].id;
    });

    it('should delete lecture as teacher', async () => {
      const res = await request(app)
        .delete(`/api/lectures/${lectureId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Lecture deleted successfully');

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/lectures/${lectureId}`)
        .set('Authorization', `Bearer ${teacherToken}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 403 if student tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/lectures/${lectureId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent lecture', async () => {
      const res = await request(app)
        .delete('/api/lectures/99999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/lectures/:id/transcribe', () => {
    let lectureId;

    beforeEach(async () => {
      const teacherRes = await pool.query('SELECT id FROM users WHERE email = $1', [
        'teacher@lecture.com',
      ]);
      const teacherId = teacherRes.rows[0].id;

      const lectureRes = await pool.query(
        'INSERT INTO lectures (course_id, teacher_id, title, description, video_url, duration) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [courseId, teacherId, 'Transcribe Me', 'Description', 'https://s3.url/video.mp4', 1800]
      );
      lectureId = lectureRes.rows[0].id;
    });

    it('should generate transcript for lecture', async () => {
      const res = await request(app)
        .post(`/api/lectures/${lectureId}/transcribe`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.transcript).toBeDefined();
      expect(res.body.transcript.lectureId).toBe(lectureId);
    });

    it('should return cached transcript on second call', async () => {
      // First call
      await request(app)
        .post(`/api/lectures/${lectureId}/transcribe`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Second call should return from cache
      const res = await request(app)
        .post(`/api/lectures/${lectureId}/transcribe`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.fromCache).toBe(true);
    });

    it('should return 404 for non-existent lecture', async () => {
      const res = await request(app)
        .post('/api/lectures/99999/transcribe')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });
});
