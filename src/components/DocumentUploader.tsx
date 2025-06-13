import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, File, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DocumentPreview } from './DocumentPreview';

export type DocumentType = 'ID' | 'PROOF_OF_ADDRESS' | 'CREDIT_REPORT' | 'DISPUTE_LETTER' | 'OTHER';

interface DocumentUploaderProps {
  userId: string;
  onUploadComplete?: (fileUrl: string, type: DocumentType) => void;
  allowedTypes?: DocumentType[];
  maxSize?: number; // in bytes
  showPreview?: boolean;
}

export default function DocumentUploader({
  userId,
  onUploadComplete,
  allowedTypes = ['ID', 'PROOF_OF_ADDRESS', 'CREDIT_REPORT', 'DISPUTE_LETTER', 'OTHER'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  showPreview = true
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: DocumentType; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const detectDocumentType = async (file: File): Promise<DocumentType> => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('id') || fileName.includes('license') || fileName.includes('passport')) {
      return 'ID';
    }
    if (fileName.includes('bill') || fileName.includes('statement') || fileName.includes('utility')) {
      return 'PROOF_OF_ADDRESS';
    }
    if (fileName.includes('report') || fileName.includes('credit') || fileName.includes('score')) {
      return 'CREDIT_REPORT';
    }
    if (fileName.includes('dispute') || fileName.includes('letter')) {
      return 'DISPUTE_LETTER';
    }
    return 'OTHER';
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      for (const file of acceptedFiles) {
        // Validate file size
        if (file.size > maxSize) {
          throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        }

        // Set preview if enabled
        if (showPreview) {
          setPreviewFile(file);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        // Upload to Supabase Storage with progress tracking
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Detect document type
        const docType = await detectDocumentType(file);

        // Validate document type
        if (!allowedTypes.includes(docType)) {
          throw new Error(`Document type ${docType} is not allowed`);
        }

        // Save document record
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            client_id: userId,
            type: docType,
            file_url: uploadData.path,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending'
          });

        if (docError) throw docError;

        // Update local state
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: docType,
          url: uploadData.path
        }]);

        // Notify parent component
        onUploadComplete?.(uploadData.path, docType);

        setUploadProgress(100);
      }

      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload documents');
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
      setPreviewFile(null);
    }
  }, [userId, onUploadComplete, allowedTypes, maxSize, showPreview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize,
    multiple: true
  });

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
            Supported formats: PDF, PNG, JPG (Max size: {maxSize / (1024 * 1024)}MB)
          </p>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">Uploading...</p>
        </div>
      )}

      {showPreview && previewFile && (
        <div className="mt-4">
          <DocumentPreview
            fileUrl={URL.createObjectURL(previewFile)}
            fileType={previewFile.type}
          />
        </div>
      )}

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
    </div>
  );
} 