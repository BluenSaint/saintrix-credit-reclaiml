import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateLetter } from '../src/lib/server/generateLetter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Optionally: Add authentication and role validation here
  try {
    const { clientName, itemName, bureau, violationType, evidence } = req.body;
    if (!clientName || !itemName || !bureau || !violationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const letter = await generateLetter({ clientName, itemName, bureau, violationType, evidence });
    return res.status(200).json({ letter });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
