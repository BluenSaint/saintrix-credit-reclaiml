import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LegalCoachService } from '@/services/legal-coach';
import { useAuth } from '@/hooks/useAuth';
import { Bot, Send, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  helpful?: boolean;
}

export function LegalCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadHistory = async () => {
    try {
      const interactions = await LegalCoachService.getUserInteractions(user!.id);
      setMessages(interactions);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setLoading(true);
    try {
      const response = await LegalCoachService.askQuestion(input, user.id);
      setMessages(prev => [...prev, response]);
      setInput('');
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (id: string, helpful: boolean) => {
    try {
      await LegalCoachService.markHelpful(id, helpful);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, helpful } : msg
        )
      );
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Legal Coach</h2>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">You</p>
                    <p className="text-sm">{message.question}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bot className="h-6 w-6 mt-2" />
                  <div className="bg-primary/10 p-3 rounded-lg flex-1">
                    <p className="font-medium">Legal Coach</p>
                    <p className="text-sm whitespace-pre-wrap">{message.answer}</p>
                    {message.category && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {message.category}
                      </p>
                    )}
                    {message.helpful === undefined && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your credit rights..."
            className="flex-1"
            rows={1}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 