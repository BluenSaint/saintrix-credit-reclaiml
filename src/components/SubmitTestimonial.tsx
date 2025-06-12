import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function SubmitTestimonial() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [scoreImprovement, setScoreImprovement] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to submit a testimonial')

      const { error } = await supabase
        .from('testimonials')
        .insert({
          client_id: user.id,
          client_name: user.user_metadata.full_name || 'Anonymous',
          rating,
          message,
          score_improvement: scoreImprovement ? parseInt(scoreImprovement) : null
        })

      if (error) throw error

      toast({
        title: 'Thank you for your feedback!',
        description: 'Your testimonial has been submitted successfully.',
      })

      // Reset form
      setRating(0)
      setMessage('')
      setScoreImprovement('')
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit testimonial. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Share Your Experience</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience?
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
                aria-label={`Rate ${star} out of 5 stars`}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    (hoverRating || rating) >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Your Testimonial
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your experience with SAINTRIX..."
            required
            className="min-h-[100px]"
          />
        </div>

        <div>
          <label htmlFor="scoreImprovement" className="block text-sm font-medium text-gray-700 mb-2">
            Credit Score Improvement (optional)
          </label>
          <Input
            id="scoreImprovement"
            type="number"
            value={scoreImprovement}
            onChange={(e) => setScoreImprovement(e.target.value)}
            placeholder="Enter the number of points your credit score improved"
            min="0"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || !rating || !message}
          className="w-full"
        >
          {submitting ? 'Submitting...' : 'Submit Testimonial'}
        </Button>
      </form>
    </Card>
  )
} 