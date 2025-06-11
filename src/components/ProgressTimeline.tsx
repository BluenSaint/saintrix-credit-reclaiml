import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, TrendingUp, Shield, Star } from "lucide-react";

interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'completed' | 'in-progress' | 'upcoming';
  icon: React.ReactNode;
}

interface ProgressTimelineProps {
  events?: TimelineEvent[];
  className?: string;
}

const ProgressTimeline = ({ events, className = "" }: ProgressTimelineProps) => {
  const defaultEvents: TimelineEvent[] = [
    {
      id: 1,
      title: "Profile Setup Complete",
      description: "Documents verified and account activated",
      date: "Jan 1, 2024",
      type: "completed",
      icon: <Shield className="w-4 h-4 text-green-600" />
    },
    {
      id: 2,
      title: "First Dispute Round Sent",
      description: "3 items disputed across all bureaus",
      date: "Jan 5, 2024",
      type: "completed",
      icon: <FileText className="w-4 h-4 text-blue-600" />
    },
    {
      id: 3,
      title: "First Item Removed",
      description: "+23 point score increase",
      date: "Jan 20, 2024",
      type: "completed",
      icon: <Star className="w-4 h-4 text-purple-600" />
    },
    {
      id: 4,
      title: "Second Round Responses",
      description: "Waiting for bureau responses",
      date: "Jan 25, 2024",
      type: "in-progress",
      icon: <Clock className="w-4 h-4 text-yellow-600" />
    },
    {
      id: 5,
      title: "Score Improvement Goal",
      description: "Target: 700+ credit score",
      date: "Feb 15, 2024",
      type: "upcoming",
      icon: <TrendingUp className="w-4 h-4 text-gray-400" />
    }
  ];

  const timelineEvents = events || defaultEvents;

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          dotColor: 'bg-green-500'
        };
      case 'in-progress':
        return {
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          dotColor: 'bg-yellow-500'
        };
      case 'upcoming':
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          dotColor: 'bg-gray-400'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          dotColor: 'bg-gray-400'
        };
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Progress Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const styles = getEventStyles(event.type);
            return (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-4 top-8 w-px h-6 bg-gray-200"></div>
                )}
                
                {/* Timeline dot */}
                <div className={`w-8 h-8 rounded-full ${styles.bgColor} border-2 ${styles.borderColor} flex items-center justify-center flex-shrink-0`}>
                  <div className={`w-3 h-3 rounded-full ${styles.dotColor}`}></div>
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <Badge 
                      variant={event.type === 'completed' ? 'default' : event.type === 'in-progress' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {event.type === 'completed' ? 'Complete' : event.type === 'in-progress' ? 'In Progress' : 'Upcoming'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {event.icon}
                    <span className="text-xs text-gray-500">{event.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTimeline;