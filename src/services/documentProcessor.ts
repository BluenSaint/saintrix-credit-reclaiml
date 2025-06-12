import { createWorker } from 'tesseract.js';
import { supabase } from '../lib/supabase';

export type DocumentType = 'ID' | 'Proof of Address' | 'Credit Report';

export interface ProcessedDocument {
  userId: string;
  type: DocumentType;
  extractedText: string;
  uploadDate: string;
  fileUrl: string;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;
  private worker: Tesseract.Worker | null = null;

  private constructor() {}

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  private async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
  }

  private async classifyDocument(text: string): Promise<DocumentType> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('driver') || lowerText.includes('license') || lowerText.includes('id')) {
      return 'ID';
    }
    
    if (lowerText.includes('utility') || lowerText.includes('bill') || lowerText.includes('statement')) {
      return 'Proof of Address';
    }
    
    if (lowerText.includes('equifax') || lowerText.includes('experian') || lowerText.includes('transunion')) {
      return 'Credit Report';
    }
    
    // Default to ID if we can't determine
    return 'ID';
  }

  public async processDocument(
    file: File,
    userId: string
  ): Promise<ProcessedDocument> {
    await this.initializeWorker();
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    // Convert file to image if it's a PDF
    const imageUrl = URL.createObjectURL(file);
    
    // Perform OCR
    const { data: { text } } = await this.worker.recognize(imageUrl);
    
    // Classify document
    const documentType = await this.classifyDocument(text);
    
    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const processedDocument: ProcessedDocument = {
      userId,
      type: documentType,
      extractedText: text,
      uploadDate: new Date().toISOString(),
      fileUrl: publicUrl
    };

    // Store metadata in Supabase
    const { error: dbError } = await supabase
      .from('documents')
      .insert([processedDocument]);

    if (dbError) {
      throw new Error(`Failed to store document metadata: ${dbError.message}`);
    }

    return processedDocument;
  }

  public async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 