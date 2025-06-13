import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentDetectionService, SentimentType } from '@/services/sentimentDetection';
import { Smile, Meh, Frown, AlertTriangle, HelpCircle } from 'lucide-react';

interface SentimentAnalysisProps {
  userId: string;
  className?: string;
}

export function SentimentAnalysis({ userId, className = "" }: SentimentAnalysisProps) {
  const [sentimentScore, setSentimentScore] = useState<number>(50);
  const [sentimentType, setSentimentType] = useState<SentimentType>('neutral');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const score = await SentimentDetectionService.getInstance().getRecentSentiment(userId);
        setSentimentScore(score);
        
        // Determine sentiment type based on score
        if (score >= 80) setSentimentType('positive');
        else if (score >= 60) setSentimentType('neutral');
        else if (score >= 40) setSentimentType('confused');
        else if (score >= 20) setSentimentType('frustrated');
        else setSentimentType('angry');
      } catch (error) {
        console.error('Error fetching sentiment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentiment();
  }, [userId]);

  const getSentimentIcon = (type: SentimentType) => {
    switch (type) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-blue-500" />;
      case 'confused':
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      case 'frustrated':
        return <Frown className="w-5 h-5 text-orange-500" />;
      case 'angry':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getSentimentColor = (type: SentimentType) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'neutral':
        return 'bg-blue-100 text-blue-800';
      case 'confused':
        return 'bg-yellow-100 text-yellow-800';
      case 'frustrated':
        return 'bg-orange-100 text-orange-800';
      case 'angry':
        return 'bg-red-100 text-red-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sentiment Analysis
          <Badge className={getSentimentColor(sentimentType)}>
            {getSentimentIcon(sentimentType)}
            <span className="ml-1">{sentimentType}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Score</span>
            <span className="text-2xl font-bold">{sentimentScore}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${sentimentScore}%`,
                backgroundColor: sentimentScore >= 60 ? '#22c55e' : sentimentScore >= 40 ? '#eab308' : '#ef4444'
              }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 