import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ExportTest() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf')
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    if (!userId) {
      toast.error('Please enter a user ID')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          format,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Export Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              User ID
            </label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Format
            </label>
            <Select
              value={format}
              onValueChange={(value: 'pdf' | 'csv') => setFormat(value)}
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </Select>
          </div>

          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Exporting...' : 'Run Export'}
          </Button>
        </div>
      </Card>
    </div>
  )
} 