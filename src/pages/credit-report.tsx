import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ClientGuard } from '@/components/guards/ClientGuard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileText, Download, Upload, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface CreditReport {
  id: string
  score: number
  created_at: string
  report_url: string
  status: 'pending' | 'completed' | 'failed'
}

export default function CreditReport() {
  const [reports, setReports] = useState<CreditReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetchCreditReports()
  }, [])

  const fetchCreditReports = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReports(data || [])
    } catch (error) {
      console.error('Error fetching credit reports:', error)
      toast.error('Failed to load credit reports')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('credit-reports')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Create credit report record
      const { error: insertError } = await supabase
        .from('credit_reports')
        .insert({
          user_id: user?.id,
          status: 'pending',
          report_url: fileName
        })

      if (insertError) throw insertError

      toast.success('Credit report uploaded successfully')
      fetchCreditReports()
    } catch (error) {
      console.error('Error uploading credit report:', error)
      toast.error('Failed to upload credit report')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (report: CreditReport) => {
    try {
      const { data, error } = await supabase.storage
        .from('credit-reports')
        .download(report.report_url)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `credit-report-${report.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading credit report:', error)
      toast.error('Failed to download credit report')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <ClientGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Credit Reports</h1>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  variant="default"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Report
                    </>
                  )}
                </Button>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {reports.length === 0 ? (
              <Card className="p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Credit Reports
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload your credit report to get started with credit repair.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button
                      variant="default"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Report
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Credit Report
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {report.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Score: {report.score}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                      {report.status === 'pending' && (
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Processing</span>
                        </div>
                      )}
                      {report.status === 'failed' && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </ClientGuard>
  )
} 