import { Card } from '@/components/ui/card'
import { Shield, Lock, Award, CheckCircle2 } from 'lucide-react'

interface TrustBadge {
  icon: React.ReactNode
  title: string
  description: string
}

const trustBadges: TrustBadge[] = [
  {
    icon: <Shield className="h-8 w-8 text-blue-500" />,
    title: 'Bank-Level Security',
    description: 'Your data is encrypted and protected with industry-standard security measures'
  },
  {
    icon: <Lock className="h-8 w-8 text-green-500" />,
    title: 'Privacy First',
    description: 'We never share your personal information with third parties'
  },
  {
    icon: <Award className="h-8 w-8 text-purple-500" />,
    title: 'BBB Accredited',
    description: 'We maintain the highest standards of business ethics and customer service'
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-orange-500" />,
    title: 'Money-Back Guarantee',
    description: 'If we don\'t improve your credit score, you get your money back'
  }
]

export function TrustBadges() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {trustBadges.map((badge, index) => (
        <Card key={index} className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {badge.icon}
            <h3 className="text-lg font-semibold">{badge.title}</h3>
            <p className="text-sm text-gray-600">{badge.description}</p>
          </div>
        </Card>
      ))}
    </div>
  )
} 