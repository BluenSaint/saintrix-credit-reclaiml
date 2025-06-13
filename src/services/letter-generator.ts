import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface LetterParams {
  clientName: string;
  itemName: string;
  bureau: 'Experian' | 'Equifax' | 'TransUnion';
  violationType: string;
  evidence?: string;
}

export async function generateLetter({
  clientName,
  itemName,
  bureau,
  violationType,
  evidence
}: LetterParams): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  // Add content to the letter
  page.drawText(`${clientName}`, {
    x: 50,
    y: height - 50,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`${bureau}`, {
    x: 50,
    y: height - 100,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Re: Dispute of ${itemName}`, {
    x: 50,
    y: height - 150,
    size: fontSize,
    font,
    color: rgb(0, 0, 0)
  });

  // Add the main letter content
  const content = `Dear ${bureau},

I am writing to dispute the following item on my credit report:

Item: ${itemName}
Violation Type: ${violationType}

${evidence ? `Evidence: ${evidence}` : ''}

Please investigate this matter and remove this item from my credit report if it cannot be verified.

Sincerely,
${clientName}`;

  page.drawText(content, {
    x: 50,
    y: height - 200,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
    maxWidth: width - 100
  });

  return pdfDoc.save();
} 