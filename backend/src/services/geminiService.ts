import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiAnalysis {
  category: string;
  sentiment: string;
  priority_score: number;
  summary: string;
  tags: string[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeFeedback(title: string, description: string): Promise<GeminiAnalysis | null> {
    try {
      const prompt = `
        Analyze this product feedback and return ONLY valid JSON with these exact fields:
        - category: one of ["Bug", "Feature Request", "Improvement", "Other"]
        - sentiment: one of ["Positive", "Neutral", "Negative"]
        - priority_score: number from 1 to 10 (10 being most critical)
        - summary: brief one-sentence summary of the feedback
        - tags: array of 2-4 relevant tags (e.g., ["UI", "Performance", "Authentication"])
        
        Feedback Title: ${title}
        Feedback Description: ${description}
        
        Return ONLY the JSON object, no other text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const analysis = JSON.parse(text);
      
      // Validate the response structure
      if (!analysis.category || !analysis.sentiment || !analysis.priority_score || !analysis.summary || !analysis.tags) {
        throw new Error('Invalid response structure from Gemini');
      }
      
      return analysis;
    } catch (error) {
      console.error('Gemini API Error:', error);
      return null;
    }
  }

  async generateWeeklySummary(feedbacks: any[]): Promise<string> {
    try {
      const feedbackText = feedbacks
        .map(f => `- ${f.title}: ${f.ai_summary || f.description}`)
        .join('\n');
      
      const prompt = `
        Based on these ${feedbacks.length} feedback items from the last 7 days, 
        identify the top 3 themes or trends. Return a concise summary.
        
        Feedback items:
        ${feedbackText}
        
        Return a brief summary (2-3 sentences) highlighting the main patterns.
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Summary Error:', error);
      return 'Unable to generate summary at this time.';
    }
  }
}

export default new GeminiService();