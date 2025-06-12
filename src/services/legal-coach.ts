import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

type LegalCoachInteraction = Database['public']['Tables']['legal_coach_interactions']['Row'];

const FCRA_FAQS = [
  {
    question: "What is the Fair Credit Reporting Act (FCRA)?",
    answer: "The FCRA is a federal law that regulates how consumer reporting agencies collect, use, and share your credit information. It gives you the right to access your credit reports, dispute inaccurate information, and control who can access your credit data."
  },
  {
    question: "How long can negative information stay on my credit report?",
    answer: "Most negative information can stay on your credit report for 7 years. Bankruptcies can stay for 7-10 years, depending on the type. Unpaid tax liens can stay indefinitely until resolved."
  },
  {
    question: "What rights do I have under the FCRA?",
    answer: "Under the FCRA, you have the right to: 1) Access your credit reports for free once a year, 2) Dispute inaccurate information, 3) Be notified if your credit report is used against you, 4) Limit who can access your credit report, and 5) Seek damages from violators."
  },
  {
    question: "How do I dispute errors on my credit report?",
    answer: "To dispute errors: 1) Get your credit report, 2) Identify the errors, 3) Write a dispute letter explaining the errors, 4) Include supporting documents, 5) Send to the credit bureau and information provider. The bureau must investigate within 30 days."
  }
];

export class LegalCoachService {
  static async askQuestion(question: string, userId: string): Promise<LegalCoachInteraction> {
    try {
      // First, check if the question matches any FAQ
      const faqMatch = FCRA_FAQS.find(faq => 
        faq.question.toLowerCase().includes(question.toLowerCase()) ||
        question.toLowerCase().includes(faq.question.toLowerCase())
      );

      let answer: string;
      let category: string;

      if (faqMatch) {
        answer = faqMatch.answer;
        category = 'FAQ';
      } else {
        // Use OpenAI to generate an answer
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a legal assistant specializing in credit reporting and the Fair Credit Reporting Act (FCRA). Provide clear, accurate, and helpful answers to questions about credit rights, credit reports, and credit disputes. Always emphasize that you are not providing legal advice and recommend consulting with a qualified attorney for specific legal matters."
            },
            {
              role: "user",
              content: question
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        answer = completion.choices[0].message.content || "I apologize, but I couldn't generate an answer at this time.";
        category = 'AI';
      }

      // Store the interaction
      const { data, error } = await supabase
        .from('legal_coach_interactions')
        .insert({
          user_id: userId,
          question,
          answer,
          category
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in askQuestion:', error);
      throw error;
    }
  }

  static async getUserInteractions(userId: string): Promise<LegalCoachInteraction[]> {
    const { data, error } = await supabase
      .from('legal_coach_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async markHelpful(id: string, helpful: boolean): Promise<LegalCoachInteraction> {
    const { data, error } = await supabase
      .from('legal_coach_interactions')
      .update({ helpful })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAnalytics(): Promise<{
    totalInteractions: number;
    helpfulRate: number;
    categoryDistribution: { category: string; count: number }[];
    recentQuestions: { question: string; category: string; created_at: string }[];
  }> {
    const { data: interactions, error } = await supabase
      .from('legal_coach_interactions')
      .select('*');

    if (error) throw error;

    const totalInteractions = interactions.length;
    const helpfulCount = interactions.filter(i => i.helpful).length;
    const helpfulRate = totalInteractions > 0 ? (helpfulCount / totalInteractions) * 100 : 0;

    const categoryCounts = interactions.reduce((acc, curr) => {
      acc[curr.category || 'Uncategorized'] = (acc[curr.category || 'Uncategorized'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    }));

    const recentQuestions = interactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(i => ({
        question: i.question,
        category: i.category || 'Uncategorized',
        created_at: i.created_at
      }));

    return {
      totalInteractions,
      helpfulRate,
      categoryDistribution,
      recentQuestions
    };
  }
} 