import { supabase } from '../lib/supabase';
import type { DocumentType } from '@/components/DocumentUploader';

export interface Document {
  id: string;
  client_id: string;
  type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'processed' | 'error';
  classification?: string;
  created_at: string;
  updated_at: string;
}

export class DocumentService {
  static async uploadDocument(
    clientId: string,
    file: File,
    type: DocumentType
  ): Promise<Document> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        type,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return document;
  }

  static async getClientDocuments(clientId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getDocument(id: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteDocument(id: string): Promise<void> {
    // Get document first to get the file path
    const document = await this.getDocument(id);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_url]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  }

  static async updateDocumentStatus(
    id: string,
    status: Document['status'],
    classification?: string
  ): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status,
        classification,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 