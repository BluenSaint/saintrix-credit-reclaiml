import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Referral = Database['public']['Tables']['referrals']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

export class ReferralService {
  static async generateReferralCode(clientId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('generate_referral_code')
      .select()
      .single();

    if (error) throw error;

    // Store the referral code
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: clientId,
        referral_code: data,
        status: 'pending'
      });

    if (insertError) throw insertError;

    return data;
  }

  static async getReferralStats(clientId: string): Promise<{
    totalReferred: number;
    completedReferrals: number;
    pendingReferrals: number;
    rewardsEarned: number;
  }> {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', clientId);

    if (error) throw error;

    return {
      totalReferred: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      rewardsEarned: referrals.filter(r => r.reward_status === 'issued').length
    };
  }

  static async applyReferralCode(code: string, newClientId: string): Promise<void> {
    // Find the referral
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', code)
      .single();

    if (findError) throw new Error('Invalid referral code');

    if (referral.status !== 'pending') {
      throw new Error('Referral code already used');
    }

    // Update the referral
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        referred_id: newClientId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        reward_type: 'free_month',
        reward_status: 'pending'
      })
      .eq('id', referral.id);

    if (updateError) throw updateError;

    // Log the successful referral
    await supabase.from('admin_logs').insert({
      action: 'referral_completed',
      details: {
        referral_id: referral.id,
        referrer_id: referral.referrer_id,
        referred_id: newClientId
      }
    });
  }

  static async getReferralHistory(clientId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:referred_id (
          full_name,
          email
        )
      `)
      .eq('referrer_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async issueReward(referralId: string): Promise<void> {
    const { data: referral, error: findError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', referralId)
      .single();

    if (findError) throw error;

    if (referral.reward_status !== 'pending') {
      throw new Error('Reward already issued or expired');
    }

    // Update reward status
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        reward_status: 'issued'
      })
      .eq('id', referralId);

    if (updateError) throw updateError;

    // Log the reward issuance
    await supabase.from('admin_logs').insert({
      action: 'referral_reward_issued',
      details: {
        referral_id: referralId,
        reward_type: referral.reward_type
      }
    });
  }
} 