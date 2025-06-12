import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, File, CheckCircle, XCircle } from 'lucide-react'

type DocumentType = 'ID' | 'PROOF' | 'REPORT' | 'OTHER'

interface DocumentUploaderProps {
  userId: string
  onUploadComplete: (fileUrl: string, type: DocumentType) => void
}

export default function DocumentUploader({ userId, onUploadComplete }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: DocumentType; url: string }>>([])

  const detectDocumentType = async (file: File): Promise<DocumentType> => {
    // TODO: Implement AI-based document type detection
    // For now, use basic file name/extension detection
    const fileName = file.name.toLowerCase()
    
    if (fileName.includes('id') || fileName.includes('license') || fileName.includes('passport')) {
      return 'ID'
    }
    if (fileName.includes('bill') || fileName.includes('statement') || fileName.includes('utility')) {
      return 'PROOF'
    }
    if (fileName.includes('report') || fileName.includes('credit') || fileName.includes('score')) {
      return 'REPORT'
    }
    return 'OTHER'
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Detect document type
        const docType = await detectDocumentType(file)

        // Save document record
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            client_id: userId,
            type: docType,
            file_url: uploadData.path
          })

        if (docError) throw docError

        // Update local state
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: docType,
          url: uploadData.path
        }])

        // Notify parent component
        onUploadComplete(uploadData.path, docType)
      }

      toast.success('Documents uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload documents')
    } finally {
      setIsUploading(false)
    }
  }, [userId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  })

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, PNG, JPG
          </p>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Uploaded Files</h3>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">Type: {file.type}</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Uploading...</p>
        </div>
      )}
    </div>
  )
} 