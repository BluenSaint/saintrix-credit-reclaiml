import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

export type SentimentType = 'positive' | 'neutral' | 'frustrated' | 'angry' | 'confused';

interface SentimentScore {
  type: SentimentType;
  score: number;
  confidence: number;
  keywords: string[];
}

export class SentimentDetectionService {
  private static instance: SentimentDetectionService;
  private openai: OpenAI;
  private readonly SENTIMENT_THRESHOLDS = {
    positive: 80,
    neutral: 60,
    confused: 40,
    frustrated: 20,
    angry: 0
  };

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  public static getInstance(): SentimentDetectionService {
    if (!SentimentDetectionService.instance) {
      SentimentDetectionService.instance = new SentimentDetectionService();
    }
    return SentimentDetectionService.instance;
  }

  private async analyzeSentiment(text: string): Promise<SentimentScore> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis expert. Analyze the following text and provide:
            1. A sentiment type (positive, neutral, frustrated, angry, or confused)
            2. A score from 0-100 where 0 is most negative and 100 is most positive
            3. A confidence score from 0-100
            4. Key phrases or words that influenced the sentiment analysis`
          },
          {
            role: "user",
            content: text
          }
        ],
        functions: [
          {
            name: "analyze_sentiment",
            parameters: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["positive", "neutral", "frustrated", "angry", "confused"]
                },
                score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 100
                },
                keywords: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              },
              required: ["type", "score", "confidence", "keywords"]
            }
          }
        ],
        function_call: { name: "analyze_sentiment" }
      });

      const result = JSON.parse(completion.choices[0].message?.function_call?.arguments || '{}');
      return {
        type: result.type as SentimentType,
        score: result.score,
        confidence: result.confidence,
        keywords: result.keywords
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        type: 'neutral',
        score: 50,
        confidence: 0,
        keywords: []
      };
    }
  }

  public async logSentimentTrigger(userId: string, trigger: string, text: string): Promise<void> {
    try {
      const sentiment = await this.analyzeSentiment(text);
      
      const { error } = await supabase
        .from('user_sentiment_logs')
        .insert({
          user_id: userId,
          trigger,
          sentiment_score: sentiment.score,
          confidence_score: sentiment.confidence,
          keywords: sentiment.keywords,
          notes: `Type: ${sentiment.type}, Keywords: ${sentiment.keywords.join(', ')}`
        });

      if (error) throw error;

      // Check if we need to create a user flag
      if (sentiment.score <= this.SENTIMENT_THRESHOLDS.frustrated && sentiment.confidence >= 70) {
        await this.createUserFlag(userId, sentiment);
      }
    } catch (error) {
      console.error('Error logging sentiment:', error);
      throw error;
    }
  }

  private async createUserFlag(userId: string, sentiment: SentimentScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_flags')
        .insert({
          user_id: userId,
          flag_type: 'at_risk',
          reason: `Negative sentiment detected (${sentiment.type}) with score ${sentiment.score} and confidence ${sentiment.confidence}. Keywords: ${sentiment.keywords.join(', ')}`,
          status: 'active'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user flag:', error);
      throw error;
    }
  }

  public async checkUserRisk(userId: string): Promise<boolean> {
    try {
      const { data: flags, error } = await supabase
        .from('user_flags')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('flag_type', 'at_risk');

      if (error) throw error;
      return flags.length > 0;
    } catch (error) {
      console.error('Error checking user risk:', error);
      return false;
    }
  }

  public async getRecentSentiment(userId: string, days: number = 30): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_sentiment_logs')
        .select('sentiment_score, confidence_score')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      if (!data.length) return 50; // Default neutral score

      // Weight scores by confidence
      const weightedSum = data.reduce((sum, log) => 
        sum + (log.sentiment_score * (log.confidence_score / 100)), 0);
      const totalConfidence = data.reduce((sum, log) => 
        sum + (log.confidence_score / 100), 0);

      return Math.round(weightedSum / totalConfidence);
    } catch (error) {
      console.error('Error getting recent sentiment:', error);
      return 50;
    }
  }

  public async getSentimentTrends(userId: string, days: number = 30): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    change: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_sentiment_logs')
        .select('sentiment_score, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!data.length) return { trend: 'stable', change: 0 };

      // Calculate average sentiment for first and second half of the period
      const midPoint = Math.floor(data.length / 2);
      const firstHalf = data.slice(0, midPoint);
      const secondHalf = data.slice(midPoint);

      const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.sentiment_score, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.sentiment_score, 0) / secondHalf.length;

      const change = secondHalfAvg - firstHalfAvg;

      return {
        trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
        change: Math.round(change)
      };
    } catch (error) {
      console.error('Error getting sentiment trends:', error);
      return { trend: 'stable', change: 0 };
    }
  }
} 