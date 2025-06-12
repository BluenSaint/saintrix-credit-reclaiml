import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentUploader } from '../DocumentUploader';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DocumentUploadStepProps {
  userId: string;
  onComplete: () => void;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  userId,
  onComplete,
}) => {
  const navigate = useNavigate();
  const {
    uploadState,
    isLoading,
    error,
    uploadDocument,
    isIntakeComplete,
    getMissingDocuments,
    fetchExistingDocuments,
  } = useDocumentUpload(userId);

  useEffect(() => {
    fetchExistingDocuments();
  }, [fetchExistingDocuments]);

  const handleDocumentProcessed = async (document: any) => {
    if (isIntakeComplete()) {
      // Update user's intake status
      const { error: updateError } = await supabase
        .from('users')
        .update({ intake_status: 'complete' })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update intake status:', updateError);
        return;
      }

      onComplete();
    }
  };

  const missingDocuments = getMissingDocuments();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Upload Required Documents</h2>
        <p className="text-gray-500">
          Please upload the following documents to complete your intake:
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {['ID', 'Proof of Address', 'Credit Report'].map((docType) => {
          const isUploaded = uploadState[
            docType === 'ID' ? 'id' :
            docType === 'Proof of Address' ? 'proofOfAddress' :
            'creditReport'
          ];

          return (
            <Card key={docType} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{docType}</h3>
                  <p className="text-sm text-gray-500">
                    {isUploaded ? 'Document uploaded' : 'Required for intake'}
                  </p>
                </div>
                {isUploaded && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>

              {!isUploaded && (
                <DocumentUploader
                  userId={userId}
                  onDocumentProcessed={handleDocumentProcessed}
                />
              )}

              {isUploaded && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(isUploaded.fileUrl, '_blank')}
                  >
                    View Document
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate('/signup')}
        >
          Back
        </Button>

        <Button
          onClick={() => navigate('/signup/sync-credit')}
          disabled={!isIntakeComplete() || isLoading}
        >
          Continue to Credit Sync
        </Button>
      </div>
    </div>
  );
}; 