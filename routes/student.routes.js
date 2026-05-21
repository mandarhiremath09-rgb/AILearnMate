const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getProgress, enrollCourse } = require('../controllers/student.controller');

const router = express.Router();

router.post('/enroll', authenticate, authorize(['student']), enrollCourse);
router.get('/progress/:courseId', authenticate, authorize(['student']), getProgress);

module.exports = router;
