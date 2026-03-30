import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import geminiService from '../services/geminiService';
import { AuthRequest } from '../middleware/auth';

// Submit new feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;
    
    // Create feedback
    const feedback = new Feedback({
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    });
    
    await feedback.save();
    
    // Trigger AI analysis asynchronously (don't await)
    geminiService.analyzeFeedback(title, description).then(async (analysis) => {
      if (analysis) {
        feedback.ai_category = analysis.category;
        feedback.ai_sentiment = analysis.sentiment as any;
        feedback.ai_priority = analysis.priority_score;
        feedback.ai_summary = analysis.summary;
        feedback.ai_tags = analysis.tags;
        feedback.ai_processed = true;
        await feedback.save();
        console.log(`AI analysis completed for feedback ${feedback._id}`);
      }
    }).catch(error => {
      console.error(`AI analysis failed for feedback ${feedback._id}:`, error);
    });
    
    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit feedback',
    });
  }
};

// Get all feedback (admin only)
export const getAllFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, sortBy, page = 1, limit = 10 } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    let sort: any = { createdAt: -1 };
    if (sortBy === 'priority') sort = { ai_priority: -1 };
    if (sortBy === 'date') sort = { createdAt: -1 };
    if (sortBy === 'sentiment') sort = { ai_sentiment: 1 };
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Feedback.countDocuments(filter),
    ]);
    
    res.json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single feedback
export const getFeedbackById = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    
    res.json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update feedback status (admin only)
export const updateFeedbackStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['New', 'In Review', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    
    res.json({
      success: true,
      data: feedback,
      message: 'Status updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete feedback (admin only)
export const deleteFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get AI summary (weekly trends)
export const getAISummary = async (req: AuthRequest, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentFeedbacks = await Feedback.find({
      createdAt: { $gte: sevenDaysAgo },
      ai_processed: true,
    });
    
    if (recentFeedbacks.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: 'Not enough feedback data to generate summary.',
          totalCount: 0,
        },
      });
    }
    
    const summary = await geminiService.generateWeeklySummary(recentFeedbacks);
    
    res.json({
      success: true,
      data: {
        summary,
        totalCount: recentFeedbacks.length,
        dateRange: {
          from: sevenDaysAgo,
          to: new Date(),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};