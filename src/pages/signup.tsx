import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import DocumentUploader from '@/components/upload/DocumentUploader'
import CreditReportSync from '@/components/credit/CreditReportSync'

type SignupStep = 'personal' | 'documents' | 'credit' | 'complete'

export default function Signup() {
  const [step, setStep] = useState<SignupStep>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dob: '',
    address: '',
    ssnLast4: ''
  })

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      // Create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: authData.user?.id,
          full_name: formData.fullName,
          dob: formData.dob,
          address: formData.address,
          ssn_last4: formData.ssnLast4
        })

      if (clientError) throw clientError

      setStep('documents')
      toast.success('Account created successfully')
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentUpload = () => {
    setStep('credit')
  }

  const handleCreditSync = () => {
    setStep('complete')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Create Your Account</h1>
              <p className="text-gray-600 mt-2">
                {step === 'personal' && 'Enter your personal information'}
                {step === 'documents' && 'Upload required documents'}
                {step === 'credit' && 'Sync your credit report'}
                {step === 'complete' && 'Setup complete!'}
              </p>
            </div>

            {step === 'personal' && (
              <form onSubmit={handlePersonalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      fullName: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dob: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last 4 digits of SSN
                  </label>
                  <Input
                    type="text"
                    maxLength={4}
                    value={formData.ssnLast4}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ssnLast4: e.target.value
                    }))}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </Button>
              </form>
            )}

            {step === 'documents' && (
              <DocumentUploader
                userId={formData.email}
                onUploadComplete={handleDocumentUpload}
              />
            )}

            {step === 'credit' && (
              <CreditReportSync
                userId={formData.email}
                onSyncComplete={handleCreditSync}
              />
            )}

            {step === 'complete' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Setup Complete!</h2>
                <p className="text-gray-600">
                  Your account has been created and is ready to use.
                </p>
                <Button
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 