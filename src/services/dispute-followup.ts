import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type DisputeFollowup = Database['public']['Tables']['dispute_followups']['Row'];

export class DisputeFollowupService {
  static async scheduleFollowup(data: Omit<DisputeFollowup, 'id' | 'created_at' | 'updated_at'>): Promise<DisputeFollowup> {
    const { data: followup, error } = await supabase
      .from('dispute_followups')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return followup;
  }

  static async getDisputeFollowups(disputeId: string): Promise<DisputeFollowup[]> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async updateFollowupStatus(id: string, status: string, responseContent?: string): Promise<DisputeFollowup> {
    const updateData: any = { status };
    
    if (status === 'sent') {
      updateData.sent_date = new Date().toISOString();
    }
    
    if (responseContent) {
      updateData.response_received = true;
      updateData.response_date = new Date().toISOString();
      updateData.response_content = responseContent;
    }

    const { data: followup, error } = await supabase
      .from('dispute_followups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return followup;
  }

  static async getPendingFollowups(): Promise<DisputeFollowup[]> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .select(`
        *,
        dispute:dispute_id (
          id,
          bureau,
          status,
          client:client_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getFollowupHistory(disputeId: string): Promise<DisputeFollowup[]> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async cancelFollowup(id: string): Promise<DisputeFollowup> {
    const { data: followup, error } = await supabase
      .from('dispute_followups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return followup;
  }

  static async rescheduleFollowup(id: string, newDate: Date): Promise<DisputeFollowup> {
    const { data: followup, error } = await supabase
      .from('dispute_followups')
      .update({
        scheduled_date: newDate.toISOString(),
        status: 'pending'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return followup;
  }
} 