import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type DisputeFollowup = Database['public']['Tables']['dispute_followups']['Row'];

export class DisputeFollowupService {
  static async scheduleFollowup(
    disputeId: string,
    type: 'email' | 'letter' | 'phone' | 'fax',
    scheduledDate: Date,
    recipient: string,
    content?: string
  ): Promise<DisputeFollowup> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .insert({
        dispute_id: disputeId,
        type,
        scheduled_date: scheduledDate.toISOString(),
        recipient,
        content,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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

  static async updateFollowupStatus(
    id: string,
    status: 'pending' | 'sent' | 'failed' | 'cancelled',
    responseContent?: string
  ): Promise<DisputeFollowup> {
    const updateData: any = { status };

    if (status === 'sent') {
      updateData.sent_date = new Date().toISOString();
    }

    if (responseContent) {
      updateData.response_content = responseContent;
      updateData.response_received = true;
      updateData.response_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('dispute_followups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingFollowups(): Promise<(DisputeFollowup & {
    dispute: {
      id: string;
      client: {
        id: string;
        full_name: string;
        email: string;
      };
    };
  })[]> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .select(`
        *,
        dispute:dispute_id (
          id,
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
    const { data, error } = await supabase
      .from('dispute_followups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rescheduleFollowup(
    id: string,
    newDate: Date
  ): Promise<DisputeFollowup> {
    const { data, error } = await supabase
      .from('dispute_followups')
      .update({
        scheduled_date: newDate.toISOString(),
        status: 'pending'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 