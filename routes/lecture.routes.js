const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const {
  uploadLecture,
  getLectures,
  getLectureDetail,
  deleteLecture,
  generateTranscript,
} = require('../controllers/lecture.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticate, authorize(['teacher']), upload.single('video'), uploadLecture);
router.get('/', authenticate, getLectures);
router.get('/:id', authenticate, getLectureDetail);
router.delete('/:id', authenticate, authorize(['teacher']), deleteLecture);
router.post('/:id/transcribe', authenticate, generateTranscript);

module.exports = router;
