import { Router } from 'express';
import {
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  getAISummary,
  getStats,
} from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard stats
router.get('/stats', getStats);

// Feedback management
router.get('/feedback', getAllFeedback);
router.patch('/feedback/:id/status', updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);

// Weekly summary
router.get('/summary', getAISummary);

export default router;
