import { supabase } from '../lib/supabase';
import { Configuration, OpenAIApi } from 'openai';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface DisputeItem {
  bureau: string;
  type: string;
  dateOpened?: string;
  status: string;
  balance?: number;
  account?: string;
}

interface GeneratedDispute {
  id: string;
  bureau: string;
  itemType: string;
  openedDate?: string;
  status: 'pending';
  round: number;
  letterUrl: string;
}

export class DisputeGenerator {
  private static instance: DisputeGenerator;
  private openai: OpenAIApi;

  private constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  public static getInstance(): DisputeGenerator {
    if (!DisputeGenerator.instance) {
      DisputeGenerator.instance = new DisputeGenerator();
    }
    return DisputeGenerator.instance;
  }

  private async generateDisputeLetter(item: DisputeItem): Promise<string> {
    const prompt = `Generate a formal dispute letter for a credit report item with the following details:
    - Type: ${item.type}
    - Bureau: ${item.bureau}
    - Date Opened: ${item.dateOpened || 'Unknown'}
    - Account: ${item.account || 'Unknown'}
    - Balance: ${item.balance || 'Unknown'}

    The letter should:
    1. Be formal and professional
    2. Reference relevant FCRA laws
    3. Request investigation and removal of the item
    4. Include specific details about the item
    5. Be concise but thorough`;

    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional credit dispute letter writer. Write formal, legally sound dispute letters that reference FCRA laws and request investigation of credit report items."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      return completion.data.choices[0].message?.content || '';
    } catch (error) {
      console.error('Error generating dispute letter:', error);
      throw new Error('Failed to generate dispute letter');
    }
  }

  private async createPDF(letter: string, item: DisputeItem): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add header
    page.drawText('Credit Dispute Letter', {
      x: 50,
      y: height - 50,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    // Add date
    const today = new Date().toLocaleDateString();
    page.drawText(today, {
      x: 50,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Add letter content
    const lines = letter.split('\n');
    let y = height - 120;
    const lineHeight = 14;

    for (const line of lines) {
      if (y < 50) {
        // Add new page if we run out of space
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - 50;
      }

      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    return pdfDoc.save();
  }

  public async generateDisputes(userId: string): Promise<GeneratedDispute[]> {
    try {
      // Get user's credit report
      const { data: creditReport, error: reportError } = await supabase
        .from('credit_reports')
        .select('*')
        .eq('user_id', userId)
        .order('sync_date', { ascending: false })
        .limit(1)
        .single();

      if (reportError) throw reportError;

      const items = creditReport.items as DisputeItem[];
      const negativeItems = items.filter(item => item.status === 'Negative');
      const generatedDisputes: GeneratedDispute[] = [];

      for (const item of negativeItems) {
        // Generate dispute letter
        const letter = await this.generateDisputeLetter(item);
        const pdfBytes = await this.createPDF(letter, item);

        // Upload letter to Supabase Storage
        const fileName = `disputes/${userId}/${Date.now()}-${item.bureau}-${item.type}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('dispute_letters')
          .upload(fileName, pdfBytes);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('dispute_letters')
          .getPublicUrl(fileName);

        // Create dispute record
        const { data: dispute, error: disputeError } = await supabase
          .from('disputes')
          .insert([{
            user_id: userId,
            bureau: item.bureau,
            item_type: item.type,
            opened_date: item.dateOpened,
            status: 'pending',
            round: 1,
            letter_url: publicUrl
          }])
          .select()
          .single();

        if (disputeError) throw disputeError;

        generatedDisputes.push(dispute);
      }

      return generatedDisputes;
    } catch (error) {
      console.error('Error generating disputes:', error);
      throw new Error('Failed to generate disputes');
    }
  }
} 