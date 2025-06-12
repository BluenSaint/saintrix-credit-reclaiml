import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type Message = Database['public']['Tables']['messages']['Row'];

export class MessageService {
  private static channel: RealtimeChannel | null = null;

  static async sendMessage(data: Omit<Message, 'id' | 'sent_at' | 'created_at'>): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  static async getThreadMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email
        ),
        recipient:recipient_id (
          id,
          full_name,
          email
        )
      `)
      .eq('thread_id', threadId)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getClientThreads(clientId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email
        ),
        recipient:recipient_id (
          id,
          full_name,
          email
        )
      `)
      .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAllThreads(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email
        ),
        recipient:recipient_id (
          id,
          full_name,
          email
        )
      `)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async markAsRead(messageId: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async uploadAttachment(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('messages')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  static subscribeToNewMessages(callback: (message: Message) => void) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        callback(payload.new as Message);
      })
      .subscribe();
  }

  static unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
} 