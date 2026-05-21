const pool = require('../config/database');
const { logger } = require('../utils/logger');

const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Check if already enrolled
    const existing = await pool.query(
      'SELECT id FROM student_enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    // Enroll student
    const result = await pool.query(
      'INSERT INTO student_enrollments (student_id, course_id, enrolled_at) VALUES ($1, $2, NOW()) RETURNING id',
      [req.user.id, courseId]
    );

    logger.info(`Student ${req.user.id} enrolled in course ${courseId}`);

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollmentId: result.rows[0].id,
    });
  } catch (err) {
    logger.error('Enroll course error:', err);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
};

const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progress = await pool.query(
      `SELECT 
        COUNT(l.id) as total_lectures,
        COUNT(lv.id) as watched_lectures,
        ROUND(COUNT(lv.id)::numeric / COUNT(l.id) * 100, 2) as progress_percentage
       FROM lectures l
       LEFT JOIN lecture_views lv ON l.id = lv.lecture_id AND lv.student_id = $1
       WHERE l.course_id = $2`,
      [req.user.id, courseId]
    );

    res.json({
      progress: progress.rows[0],
    });
  } catch (err) {
    logger.error('Get progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};

module.exports = {
  enrollCourse,
  getProgress,
};
