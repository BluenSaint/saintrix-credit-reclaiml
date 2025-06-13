import { supabase } from '@/integrations/supabase/client';

export interface SentimentTrigger {
  type: 'inactivity' | 'support_contact' | 'missing_docs' | 'unopened_letters';
  userId: string;
  details?: string;
}

export class SentimentDetectionService {
  private static readonly SCORE_WEIGHTS = {
    inactivity: 30, // 3+ days of inactivity
    support_contact: 25, // 2+ support contacts
    missing_docs: 25, // 5+ days missing docs
    unopened_letters: 20, // Generated but unopened letters
  };

  private static readonly THRESHOLD = 70;

  /**
   * Log a sentiment trigger and calculate score
   */
  static async logSentimentTrigger(trigger: SentimentTrigger): Promise<void> {
    const score = this.calculateScore(trigger);
    
    await supabase
      .from('user_sentiment_logs')
      .insert({
        user_id: trigger.userId,
        trigger: trigger.type,
        sentiment_score: score,
        notes: trigger.details,
      });
  }

  /**
   * Calculate sentiment score based on trigger type
   */
  private static calculateScore(trigger: SentimentTrigger): number {
    return this.SCORE_WEIGHTS[trigger.type] || 0;
  }

  /**
   * Check if a user is at risk of churn
   */
  static async isUserAtRisk(userId: string): Promise<boolean> {
    const { data: flags } = await supabase
      .from('user_flags')
      .select('*')
      .eq('user_id', userId)
      .eq('flag_type', 'at_risk')
      .eq('status', 'active')
      .single();

    return !!flags;
  }

  /**
   * Get all at-risk users
   */
  static async getAtRiskUsers(): Promise<any[]> {
    const { data: users } = await supabase
      .from('user_flags')
      .select(`
        *,
        user:user_id (
          id,
          email,
          created_at
        )
      `)
      .eq('flag_type', 'at_risk')
      .eq('status', 'active');

    return users || [];
  }

  /**
   * Resolve a user flag
   */
  static async resolveFlag(flagId: string, resolution: 'resolved' | 'false_positive'): Promise<void> {
    await supabase
      .from('user_flags')
      .update({
        status: resolution,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', flagId);
  }
} 