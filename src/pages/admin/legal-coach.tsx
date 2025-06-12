import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalCoachService } from '@/services/legal-coach';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from 'lucide-react';

interface Analytics {
  totalInteractions: number;
  helpfulResponses: number;
  unhelpfulResponses: number;
  averageResponseTime: number;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  recentInteractions: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    created_at: string;
    helpful: boolean | null;
  }>;
}

export default function AdminLegalCoachPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await LegalCoachService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Legal Coach Analytics</h1>
          <p className="text-muted-foreground">
            Monitor and analyze legal coach interactions and performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Interactions</h3>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalInteractions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Helpful Responses</h3>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.helpfulResponses}</div>
              <p className="text-xs text-muted-foreground">
                {analytics && analytics.totalInteractions > 0
                  ? `${Math.round((analytics.helpfulResponses / analytics.totalInteractions) * 100)}% satisfaction`
                  : 'No interactions yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Unhelpful Responses</h3>
              <ThumbsDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.unhelpfulResponses}</div>
              <p className="text-xs text-muted-foreground">
                {analytics && analytics.totalInteractions > 0
                  ? `${Math.round((analytics.unhelpfulResponses / analytics.totalInteractions) * 100)}% dissatisfaction`
                  : 'No interactions yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Avg. Response Time</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.averageResponseTime.toFixed(1)}s
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Top Questions</h2>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {analytics?.topQuestions.map((item, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {item.question}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Asked {item.count} times
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Recent Interactions</h2>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {analytics?.recentInteractions.map((interaction) => (
                    <div key={interaction.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {format(new Date(interaction.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        {interaction.helpful !== null && (
                          <div className="flex items-center gap-1">
                            {interaction.helpful ? (
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Q: {interaction.question}</p>
                        <p className="text-sm text-muted-foreground">
                          A: {interaction.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {interaction.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 