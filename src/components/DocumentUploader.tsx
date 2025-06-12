import React, { useState } from 'react';
import { DocumentProcessor, ProcessedDocument } from '../services/documentProcessor';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface DocumentUploaderProps {
  userId: string;
  onDocumentProcessed: (document: ProcessedDocument) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  userId,
  onDocumentProcessed,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const processor = DocumentProcessor.getInstance();
      const result = await processor.processDocument(file, userId);
      
      setProcessedDocument(result);
      onDocumentProcessed(result);
      
      toast.success('Document processed successfully!');
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Upload Document</h3>
        <p className="text-sm text-gray-500">
          Upload your ID, proof of address, or credit report
        </p>
      </div>

      <div className="space-y-4">
        <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700">
          Choose a file to upload
        </label>
        <input
          id="document-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-500">Processing document...</p>
          </div>
        )}

        {processedDocument && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Document Classification Results</h4>
            <div className="mt-2 space-y-2">
              <p><span className="font-medium">Type:</span> {processedDocument.type}</p>
              <p><span className="font-medium">Upload Date:</span> {new Date(processedDocument.uploadDate).toLocaleDateString()}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(processedDocument.fileUrl, '_blank')}
              >
                View Document
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}; 