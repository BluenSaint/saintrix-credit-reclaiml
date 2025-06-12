import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

export async function generateLetter({
  clientName,
  itemName,
  bureau,
  violationType,
  evidence
}: {
  clientName: string;
  itemName: string;
  bureau: string;
  violationType: string;
  evidence?: string;
}): Promise<string> {
  const prompt = `You are a legal assistant for a credit repair SaaS. Write a unique, legally compliant FCRA dispute letter for the following:

Client: ${clientName}
Bureau: ${bureau}
Item: ${itemName}
Violation: ${violationType}
${evidence ? `Evidence: ${evidence}` : ""}

Tone: Knowledgeable, human, and professional. Include FCRA citations and make the letter fingerprint-unique.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a legal assistant for a credit repair SaaS." },
      { role: "user", content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.7
  });
  return response.choices[0].message.content || "";
} 