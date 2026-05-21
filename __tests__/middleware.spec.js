const { authenticate, authorize } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  describe('authenticate', () => {
    it('should attach user to request with valid token', () => {
      const token = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'teacher' },
        process.env.JWT_SECRET
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = {};
      const next = jest.fn();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return 401 if invalid token provided', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });

  describe('authorize', () => {
    it('should allow user with authorized role', () => {
      const req = {
        user: { role: 'teacher' },
      };
      const res = {};
      const next = jest.fn();

      const authMiddleware = authorize(['teacher']);
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow user with multiple authorized roles', () => {
      const req = {
        user: { role: 'student' },
      };
      const res = {};
      const next = jest.fn();

      const authMiddleware = authorize(['teacher', 'student']);
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny user with unauthorized role', () => {
      const req = {
        user: { role: 'student' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      const authMiddleware = authorize(['teacher']);
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
