import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Parser } from 'json2csv'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Client = Database['public']['Tables']['clients']['Row']
type Dispute = Database['public']['Tables']['disputes']['Row']
type Document = Database['public']['Tables']['documents']['Row']

export class ExportClient {
  private client: Client
  private disputes: Dispute[]
  private documents: Document[]

  constructor(client: Client, disputes: Dispute[], documents: Document[]) {
    this.client = client
    this.disputes = disputes
    this.documents = documents
  }

  async generatePDF(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 12

    // Add client information
    page.drawText(`Client Information`, {
      x: 50,
      y: height - 50,
      size: fontSize + 4,
      font,
      color: rgb(0, 0, 0),
    })

    const clientInfo = [
      `Name: ${this.client.full_name}`,
      `Date of Birth: ${this.client.dob}`,
      `Address: ${this.client.address}`,
      `SSN Last 4: ${this.client.ssn_last4}`,
      `Created: ${new Date(this.client.created_at).toLocaleDateString()}`,
    ]

    clientInfo.forEach((info, index) => {
      page.drawText(info, {
        x: 50,
        y: height - 80 - (index * 20),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    })

    // Add disputes information
    if (this.disputes.length > 0) {
      page.drawText(`Disputes`, {
        x: 50,
        y: height - 200,
        size: fontSize + 4,
        font,
        color: rgb(0, 0, 0),
      })

      this.disputes.forEach((dispute, index) => {
        const disputeInfo = [
          `Bureau: ${dispute.bureau}`,
          `Reason: ${dispute.reason}`,
          `Status: ${dispute.status}`,
          `Created: ${new Date(dispute.created_at).toLocaleDateString()}`,
        ]

        disputeInfo.forEach((info, infoIndex) => {
          page.drawText(info, {
            x: 50,
            y: height - 230 - (index * 80) - (infoIndex * 20),
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          })
        })
      })
    }

    return pdfDoc.save()
  }

  generateCSV(): string {
    const fields = ['id', 'full_name', 'dob', 'address', 'ssn_last4', 'created_at']
    const parser = new Parser({ fields })
    return parser.parse(this.client)
  }

  async saveDocument(type: 'pdf' | 'csv', content: Uint8Array | string): Promise<void> {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${this.client.id}/${type}-${Date.now()}.${type}`, content)

    if (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`)
    }

    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        client_id: this.client.id,
        type,
        file_url: uploadData.path,
      })

    if (documentError) {
      throw new Error(`Failed to save document record: ${documentError.message}`)
    }
  }
} 