import { Request, Response } from 'express';
import Feedback from '../models/Feedback';
import geminiService from '../services/geminiService';
import { AuthRequest } from '../middleware/auth';

const runAndPersistGeminiAnalysis = async (feedbackId: string) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    return null;
  }

  const analysis = await geminiService.analyzeFeedback(feedback.title, feedback.description);
  if (!analysis) {
    return {
      feedback,
      analyzed: false,
    };
  }

  feedback.ai_category = analysis.category;
  feedback.ai_sentiment = analysis.sentiment;
  feedback.ai_priority = analysis.priority_score;
  feedback.ai_summary = analysis.summary;
  feedback.ai_tags = analysis.tags;
  feedback.ai_processed = true;
  await feedback.save();

  return {
    feedback,
    analyzed: true,
  };
};

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
    
    // Trigger AI analysis asynchronously so feedback is saved even if AI fails.
    runAndPersistGeminiAnalysis(String(feedback._id)).then((result) => {
      if (result?.analyzed) {
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
    const { category, status, sortBy, page = 1, limit = 10, search } = req.query;
    
    const filter: any = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    
    // Search in title and ai_summary
    if (search && (search as string).trim()) {
      const searchRegex = new RegExp((search as string).trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { ai_summary: searchRegex },
      ];
    }
    
    let sort: any = { createdAt: -1 };
    if (sortBy === 'priority') sort = { ai_priority: -1 };
    if (sortBy === 'date') sort = { createdAt: -1 };
    if (sortBy === 'sentiment') sort = { ai_sentiment: 1 };
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
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

// Get dashboard statistics
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const [total, openCount, allFeedbacks] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: { $ne: 'Resolved' } }),
      Feedback.find({ ai_processed: true, ai_priority: { $exists: true } }),
    ]);

    // Calculate average priority score
    const avgPriority =
      allFeedbacks.length > 0
        ? (
            allFeedbacks.reduce((sum, f) => sum + (f.ai_priority || 0), 0) /
            allFeedbacks.length
          ).toFixed(1)
        : 0;

    // Count tags and find most common
    const tagCounts: Record<string, number> = {};
    allFeedbacks.forEach((f) => {
      (f.ai_tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const mostCommonTag =
      Object.entries(tagCounts).length > 0
        ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    res.json({
      success: true,
      data: {
        totalFeedback: total,
        openItems: openCount,
        averagePriority: parseFloat(avgPriority as string),
        mostCommonTag,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Manually re-run AI analysis for one feedback item (admin only)
export const retriggerAIAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const feedbackId = String(req.params.id);
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    const result = await runAndPersistGeminiAnalysis(feedbackId);
    if (!result?.analyzed) {
      return res.status(502).json({
        success: false,
        message: 'Gemini analysis failed to produce valid structured JSON. Please retry or verify GEMINI_API_KEY/quota.',
      });
    }

    res.json({
      success: true,
      data: result.feedback,
      message: 'AI analysis re-triggered successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};