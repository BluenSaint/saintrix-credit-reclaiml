import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://saintrix-credit-reclaiml.vercel.app",
    "X-Title": "SAINTRIX Credit AI Agent",
  },
});

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
  const prompt = `You are a legal assistant for a credit repair SaaS. Write a unique, legally compliant FCRA dispute letter for the following:\n\nClient: ${clientName}\nBureau: ${bureau}\nItem: ${itemName}\nViolation: ${violationType}\n${evidence ? `Evidence: ${evidence}` : ""}\n\nTone: Knowledgeable, human, and professional. Include FCRA citations and make the letter fingerprint-unique.`;

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You are a legal assistant for a credit repair SaaS." },
      { role: "user", content: prompt }
    ],
    max_tokens: 800,
    temperature: 0.7
  });
  return response.choices[0].message.content || "";
} 