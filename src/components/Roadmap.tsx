import { Card } from '@/components/ui/card'
import { CheckCircle2, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'planned'
  priority: 'high' | 'medium' | 'low'
  estimated_completion?: string
}

const roadmapItems: RoadmapItem[] = [
  {
    id: '1',
    title: 'AI-Powered Dispute Generation',
    description: 'Automated dispute letter generation using advanced AI models',
    status: 'completed',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Real-time Credit Monitoring',
    description: 'Instant notifications for credit score changes and updates',
    status: 'in_progress',
    priority: 'high',
    estimated_completion: 'Q2 2024'
  },
  {
    id: '3',
    title: 'Mobile App Development',
    description: 'Native mobile applications for iOS and Android',
    status: 'planned',
    priority: 'medium',
    estimated_completion: 'Q3 2024'
  },
  {
    id: '4',
    title: 'Advanced Analytics Dashboard',
    description: 'Detailed insights and predictions for credit improvement',
    status: 'planned',
    priority: 'medium',
    estimated_completion: 'Q3 2024'
  },
  {
    id: '5',
    title: 'Integration with Major Credit Bureaus',
    description: 'Direct API integration with Experian, Equifax, and TransUnion',
    status: 'planned',
    priority: 'high',
    estimated_completion: 'Q4 2024'
  }
]

export function Roadmap() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Product Roadmap</h2>
      
      <div className="space-y-6">
        {roadmapItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0">
              {item.status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : item.status === 'in_progress' ? (
                <Clock className="h-6 w-6 text-blue-500" />
              ) : (
                <Star className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{item.title}</h3>
                <span
                  className={cn(
                    'text-sm px-2 py-1 rounded-full',
                    item.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : item.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  )}
                >
                  {item.priority} priority
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              
              {item.estimated_completion && (
                <p className="text-sm text-gray-500 mt-2">
                  Estimated completion: {item.estimated_completion}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 