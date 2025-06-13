import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '../DocumentUploader';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DocumentType } from '../DocumentUploader';

interface DocumentUploadStepProps {
  userId: string;
  onComplete: () => void;
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({
  userId,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [uploadedDocs, setUploadedDocs] = useState<Record<DocumentType, boolean>>({
    ID: false,
    PROOF_OF_ADDRESS: false,
    CREDIT_REPORT: false,
    DISPUTE_LETTER: false,
    OTHER: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingDocuments();
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('type')
        .eq('client_id', userId);

      if (error) throw error;

      const newState = { ...uploadedDocs };
      data.forEach((doc: { type: DocumentType }) => {
        newState[doc.type] = true;
      });
      setUploadedDocs(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  };

  const handleUploadComplete = async (fileUrl: string, type: DocumentType) => {
    setUploadedDocs(prev => ({ ...prev, [type]: true }));

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

  const isIntakeComplete = () => {
    return uploadedDocs.ID && uploadedDocs.PROOF_OF_ADDRESS && uploadedDocs.CREDIT_REPORT;
  };

  const getMissingDocuments = () => {
    const missing: string[] = [];
    if (!uploadedDocs.ID) missing.push('ID');
    if (!uploadedDocs.PROOF_OF_ADDRESS) missing.push('Proof of Address');
    if (!uploadedDocs.CREDIT_REPORT) missing.push('Credit Report');
    return missing;
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
        {['ID', 'PROOF_OF_ADDRESS', 'CREDIT_REPORT'].map((docType) => {
          const isUploaded = uploadedDocs[docType as DocumentType];

          return (
            <Card key={docType} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{docType.replace('_', ' ')}</h3>
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
                  onUploadComplete={handleUploadComplete}
                  allowedTypes={[docType as DocumentType]}
                  showPreview={true}
                />
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
          disabled={!isIntakeComplete()}
        >
          Continue to Credit Sync
        </Button>
      </div>
    </div>
  );
}; 