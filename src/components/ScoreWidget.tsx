import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ScoreWidgetProps {
  currentScore: number;
  previousScore?: number;
  className?: string;
}

const ScoreWidget = ({ currentScore, previousScore = 0, className = "" }: ScoreWidgetProps) => {
  const scoreChange = currentScore - previousScore;
  const isPositive = scoreChange >= 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 740) return "text-green-600";
    if (score >= 670) return "text-blue-600";
    if (score >= 580) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 740) return "Excellent";
    if (score >= 670) return "Good";
    if (score >= 580) return "Fair";
    return "Poor";
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Credit Score
          {previousScore > 0 && (
            <Badge className={`${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isPositive ? '+' : ''}{scoreChange}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(currentScore)} animate-score-count`}>
              {currentScore}
            </div>
            <div className="text-sm text-gray-500">{getScoreLabel(currentScore)}</div>
          </div>
          <div className="w-24 h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${(currentScore / 850) * 251} 251`}
                className={getScoreColor(currentScore)}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(currentScore / 850) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>300</span>
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
          <span>850</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreWidget;