import { SuccessStories } from '@/components/SuccessStories'
import { TrustBadges } from '@/components/TrustBadges'
import { Roadmap } from '@/components/Roadmap'
import { SubmitTestimonial } from '@/components/SubmitTestimonial'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Why Trust SAINTRIX?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to transparency, security, and your success in improving your credit score.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Trust Badges */}
          <TrustBadges />

          {/* Success Stories */}
          <SuccessStories />
        </div>

        {/* Roadmap */}
        <div className="mb-12">
          <Roadmap />
        </div>

        {/* Testimonial Submission */}
        <div className="mb-12">
          <SubmitTestimonial />
        </div>

        {/* Call to Action */}
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Improve Your Credit?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of satisfied clients who have successfully improved their credit scores with SAINTRIX.
          </p>
          <Button
            size="lg"
            className="gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  )
} 