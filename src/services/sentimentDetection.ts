import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

export type SentimentType = 'positive' | 'neutral' | 'frustrated' | 'angry' | 'confused';

interface SentimentScore {
  type: SentimentType;
  score: number;
}

export class SentimentDetectionService {
  private static instance: SentimentDetectionService;
  private openai: OpenAI;

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
            content: "You are a sentiment analysis expert. Analyze the following text and classify it as one of: positive, neutral, frustrated, angry, or confused. Also provide a score from 0-100 where 0 is most negative and 100 is most positive."
          },
          {
            role: "user",
            content: text
          }
        ],
        functions: [
          {
            name: "classify_sentiment",
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
                }
              },
              required: ["type", "score"]
            }
          }
        ],
        function_call: { name: "classify_sentiment" }
      });

      const result = JSON.parse(completion.choices[0].message?.function_call?.arguments || '{}');
      return {
        type: result.type as SentimentType,
        score: result.score
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { type: 'neutral', score: 50 };
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
          notes: `Type: ${sentiment.type}`
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging sentiment:', error);
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
        .select('sentiment_score')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      if (!data.length) return 50; // Default neutral score

      const totalScore = data.reduce((sum, log) => sum + log.sentiment_score, 0);
      return Math.round(totalScore / data.length);
    } catch (error) {
      console.error('Error getting recent sentiment:', error);
      return 50;
    }
  }
} 