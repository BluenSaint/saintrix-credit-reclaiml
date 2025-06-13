import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Client = Database['public']['Tables']['clients']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];
type Dispute = Database['public']['Tables']['disputes']['Row'];
type CreditReport = Database['public']['Tables']['credit_reports']['Row'];

export class CasePackGenerator {
  private client: Client;
  private documents: Document[];
  private disputes: Dispute[];
  private creditReports: CreditReport[];

  constructor(
    client: Client,
    documents: Document[],
    disputes: Dispute[],
    creditReports: CreditReport[]
  ) {
    this.client = client;
    this.documents = documents;
    this.disputes = disputes;
    this.creditReports = creditReports;
  }

  async generateCasePack(): Promise<Blob> {
    const zip = new JSZip();

    // Add client information PDF
    const clientInfoPdf = await this.generateClientInfoPdf();
    zip.file('client-information.pdf', clientInfoPdf);

    // Add timeline PDF
    const timelinePdf = await this.generateTimelinePdf();
    zip.file('dispute-timeline.pdf', timelinePdf);

    // Add all documents
    for (const doc of this.documents) {
      try {
        const response = await fetch(doc.file_url);
        const blob = await response.blob();
        zip.file(`documents/${doc.type}-${doc.id}.pdf`, blob);
      } catch (error) {
        console.error(`Failed to fetch document ${doc.id}:`, error);
      }
    }

    // Add credit reports
    for (const report of this.creditReports) {
      const reportPdf = await this.generateCreditReportPdf(report);
      zip.file(`credit-reports/${report.id}.pdf`, reportPdf);
    }

    // Generate and add the final ZIP
    return await zip.generateAsync({ type: 'blob' });
  }

  private async generateClientInfoPdf(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Add client information
    page.drawText('Client Information', {
      x: 50,
      y: height - 50,
      size: fontSize + 4,
      font,
      color: rgb(0, 0, 0),
    });

    const clientInfo = [
      `Name: ${this.client.full_name}`,
      `Date of Birth: ${this.client.dob}`,
      `Address: ${this.client.address}`,
      `SSN Last 4: ${this.client.ssn_last4}`,
      `Created: ${new Date(this.client.created_at).toLocaleDateString()}`,
    ];

    clientInfo.forEach((info, index) => {
      page.drawText(info, {
        x: 50,
        y: height - 80 - (index * 20),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    return pdfDoc.save();
  }

  private async generateTimelinePdf(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Add timeline title
    page.drawText('Dispute Timeline', {
      x: 50,
      y: height - 50,
      size: fontSize + 4,
      font,
      color: rgb(0, 0, 0),
    });

    // Add disputes in chronological order
    const sortedDisputes = [...this.disputes].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedDisputes.forEach((dispute, index) => {
      const y = height - 80 - (index * 60);
      const disputeInfo = [
        `Bureau: ${dispute.bureau}`,
        `Status: ${dispute.status}`,
        `Created: ${new Date(dispute.created_at).toLocaleDateString()}`,
        `Reason: ${dispute.reason}`,
      ];

      disputeInfo.forEach((info, infoIndex) => {
        page.drawText(info, {
          x: 50,
          y: y - (infoIndex * 20),
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
    });

    return pdfDoc.save();
  }

  private async generateCreditReportPdf(report: CreditReport): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    // Add credit report information
    page.drawText('Credit Report', {
      x: 50,
      y: height - 50,
      size: fontSize + 4,
      font,
      color: rgb(0, 0, 0),
    });

    const reportInfo = [
      `Score: ${report.score}`,
      `Synced: ${new Date(report.synced_at).toLocaleDateString()}`,
    ];

    reportInfo.forEach((info, index) => {
      page.drawText(info, {
        x: 50,
        y: height - 80 - (index * 20),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    return pdfDoc.save();
  }
}

export async function generateCasePackForClient(userId: string) {
  try {
    // Get session and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Unauthorized');
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    // Fetch related data
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id);

    const { data: disputes } = await supabase
      .from('disputes')
      .select('*')
      .eq('client_id', client.id);

    const { data: creditReports } = await supabase
      .from('credit_reports')
      .select('*')
      .eq('user_id', userId);

    // Generate case pack
    const casePackGenerator = new CasePackGenerator(
      client,
      documents || [],
      disputes || [],
      creditReports || []
    );

    const casePackBlob = await casePackGenerator.generateCasePack();

    // Log the export action
    await supabase.from('admin_logs').insert({
      admin_id: session.user.id,
      action: 'export_case_pack',
      target_user_id: userId,
      timestamp: new Date().toISOString(),
      details: {
        client_id: client.id,
        documents_count: documents?.length || 0,
        disputes_count: disputes?.length || 0,
        credit_reports_count: creditReports?.length || 0
      }
    });

    return casePackBlob;
  } catch (error: any) {
    console.error('Case pack generation error:', error);
    throw error;
  }
} 