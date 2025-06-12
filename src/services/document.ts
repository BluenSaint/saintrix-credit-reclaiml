import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Document = Database['public']['Tables']['documents']['Row'];

export class DocumentService {
  static async uploadDocument(
    clientId: string,
    file: File,
    type: string
  ): Promise<Document> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `documents/${clientId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

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

    // Trigger OCR and classification (simulated)
    this.processDocument(document.id);

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

  static async getAllDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:client_id (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateDocumentType(id: string, type: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({ type })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async processDocument(documentId: string): Promise<void> {
    // Simulate OCR and classification processing
    setTimeout(async () => {
      try {
        const { data: document } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (!document) return;

        // Simulate OCR text extraction
        const ocrText = "Sample OCR text extracted from document...";
        
        // Simulate document classification
        const classification = this.classifyDocument(document.type, ocrText);

        // Update document with OCR and classification results
        await supabase
          .from('documents')
          .update({
            ocr_text: ocrText,
            classification,
            status: 'processed'
          })
          .eq('id', documentId);
      } catch (error) {
        console.error('Document processing error:', error);
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId);
      }
    }, 2000); // Simulate 2-second processing time
  }

  private static classifyDocument(type: string, ocrText: string): string {
    // Simple classification logic based on document type and OCR text
    const typeLower = type.toLowerCase();
    const textLower = ocrText.toLowerCase();

    if (typeLower.includes('id') || textLower.includes('identification')) {
      return 'identification';
    } else if (typeLower.includes('address') || textLower.includes('proof of address')) {
      return 'proof_of_address';
    } else if (typeLower.includes('credit') || textLower.includes('credit report')) {
      return 'credit_report';
    } else if (typeLower.includes('dispute') || textLower.includes('dispute letter')) {
      return 'dispute_letter';
    } else {
      return 'other';
    }
  }
} 