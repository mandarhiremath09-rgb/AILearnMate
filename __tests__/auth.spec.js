const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const pool = require('../../config/database');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await global.clearDatabase();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new teacher account', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'teacher@example.com',
        password: 'password123',
        name: 'John Teacher',
        role: 'teacher',
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.user.email).toBe('teacher@example.com');
      expect(res.body.user.role).toBe('teacher');
      expect(res.body.token).toBeDefined();
    });

    it('should create a new student account', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'student@example.com',
        password: 'password123',
        name: 'Jane Student',
        role: 'student',
      });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('student');
      expect(res.body.token).toBeDefined();
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'teacher',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
        role: 'teacher',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
      });

      expect(res.status).toBe(400);
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'User 1',
        role: 'teacher',
      });

      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'User 2',
        role: 'teacher',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'teacher',
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user.email).toBe('user@example.com');
      expect(res.body.token).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 if email is invalid format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
        role: 'student',
      });
      token = signupRes.body.token;
      userId = signupRes.body.user.id;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('profile@example.com');
      expect(res.body.user.name).toBe('Profile User');
      expect(res.body.user.role).toBe('student');
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should return 401 if invalid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });
});
