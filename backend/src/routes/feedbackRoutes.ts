import { Router } from 'express';
import {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getAISummary,
} from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', submitFeedback);

// Protected admin routes
router.get('/', authenticate, getAllFeedback);
router.get('/summary', authenticate, getAISummary);
router.get('/:id', authenticate, getFeedbackById);
router.patch('/:id', authenticate, updateFeedbackStatus);
router.delete('/:id', authenticate, deleteFeedback);

export default router;