import { GoogleGenAI } from '@google/genai';

interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

const VALID_CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'] as const;
const VALID_SENTIMENTS = ['Positive', 'Neutral', 'Negative'] as const;

class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private modelName = 'gemini-3-flash-preview';
  private initialized = false;

  private initializeModel() {
    if (this.initialized) return;

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not defined—AI analysis will fail');
      this.initialized = true;
      return;
    }

    try {
      this.modelName = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      this.initialized = true;
      console.log(`Gemini service initialized successfully with model: ${this.modelName}`);
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      this.initialized = true;
    }
  }

  private extractJsonObject(rawText: string): string {
    const trimmed = rawText.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return trimmed;
  }

  private parseJsonSafely(jsonText: string): any {
    try {
      return JSON.parse(jsonText);
    } catch {
      const withoutTrailingCommas = jsonText.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(withoutTrailingCommas);
    }
  }

  private normalizeCategory(value: unknown): GeminiAnalysis['category'] | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized.includes('feature')) return 'Feature Request';
    if (normalized.includes('improvement') || normalized.includes('enhancement')) return 'Improvement';
    if (normalized.includes('bug') || normalized.includes('defect') || normalized.includes('error')) return 'Bug';
    if (normalized.includes('other')) return 'Other';

    const exact = VALID_CATEGORIES.find((item) => item.toLowerCase() === normalized);
    return exact ?? null;
  }

  private normalizeSentiment(value: unknown): GeminiAnalysis['sentiment'] | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized.includes('pos')) return 'Positive';
    if (normalized.includes('neu')) return 'Neutral';
    if (normalized.includes('neg')) return 'Negative';

    const exact = VALID_SENTIMENTS.find((item) => item.toLowerCase() === normalized);
    return exact ?? null;
  }

  private normalizeTags(value: unknown): string[] {
    const tags = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [];

    const normalized = tags
      .map((tag) => String(tag).trim())
      .filter((tag) => tag.length > 0);

    return Array.from(new Set(normalized)).slice(0, 6);
  }

  private normalizeAnalysis(raw: any): GeminiAnalysis | null {
    const category = this.normalizeCategory(raw?.category);
    const sentiment = this.normalizeSentiment(raw?.sentiment);
    const summary = typeof raw?.summary === 'string' ? raw.summary.trim() : '';
    const tags = this.normalizeTags(raw?.tags);
    const priority = Number(raw?.priority_score);

    if (!category || !sentiment || !summary || tags.length === 0 || !Number.isFinite(priority)) {
      return null;
    }

    return {
      category,
      sentiment,
      priority_score: Math.max(1, Math.min(10, Math.round(priority))),
      summary,
      tags,
    };
  }

  async analyzeFeedback(title: string, description: string): Promise<GeminiAnalysis | null> {
    this.initializeModel();

    if (!this.genAI) {
      console.error('Gemini model not available for analysis');
      return null;
    }

    const prompts = [
      `
        Analyse this product feedback. Return ONLY valid JSON with these fields:
        - category: one of ["Bug", "Feature Request", "Improvement", "Other"]
        - sentiment: one of ["Positive", "Neutral", "Negative"]
        - priority_score: number from 1 to 10 (10 being most critical)
        - summary: brief one-sentence summary of the feedback
        - tags: array of 2-4 relevant tags (e.g., ["UI", "Performance", "Authentication"])

        Feedback Title: ${title}
        Feedback Description: ${description}

        Return ONLY the JSON object, no other text.
      `,
      `
        Return ONLY strict JSON (no markdown, no explanations) for this feedback.
        Schema:
        {
          "category": "Bug | Feature Request | Improvement | Other",
          "sentiment": "Positive | Neutral | Negative",
          "priority_score": 1,
          "summary": "one sentence",
          "tags": ["tag1", "tag2"]
        }

        title: ${title}
        description: ${description}
      `,
    ];

    for (const prompt of prompts) {
      try {
        const response = await this.genAI.models.generateContent({
          model: this.modelName,
          contents: prompt,
        });
        const text = response.text ?? '';
        const jsonText = this.extractJsonObject(text);
        const parsed = this.parseJsonSafely(jsonText);
        const normalized = this.normalizeAnalysis(parsed);

        if (normalized) {
          console.log('Successfully analyzed feedback');
          return normalized;
        }
      } catch (error) {
        console.error('Gemini API attempt failed:', error);
      }
    }

    return null;
  }

  async generateWeeklySummary(feedbacks: any[]): Promise<string> {
    this.initializeModel();

    if (!this.genAI) {
      console.error('Gemini model not available for summary generation');
      return 'Unable to generate summary—AI service not available.';
    }

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
      
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });
      return response.text ?? 'Unable to generate summary at this time.';
    } catch (error) {
      console.error('Gemini Summary Error:', error);
      return 'Unable to generate summary at this time.';
    }
  }
}

export default new GeminiService();