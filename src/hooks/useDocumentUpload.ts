import { useState } from 'react';
import { DocumentProcessor, ProcessedDocument } from '../services/documentProcessor';
import { supabase } from '../lib/supabase';

interface DocumentUploadState {
  id: ProcessedDocument | null;
  proofOfAddress: ProcessedDocument | null;
  creditReport: ProcessedDocument | null;
}

export const useDocumentUpload = (userId: string) => {
  const [uploadState, setUploadState] = useState<DocumentUploadState>({
    id: null,
    proofOfAddress: null,
    creditReport: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const processor = DocumentProcessor.getInstance();
      const result = await processor.processDocument(file, userId);

      setUploadState(prev => ({
        ...prev,
        [result.type === 'ID' ? 'id' : 
         result.type === 'Proof of Address' ? 'proofOfAddress' : 
         'creditReport']: result
      }));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isIntakeComplete = () => {
    return uploadState.id && uploadState.proofOfAddress && uploadState.creditReport;
  };

  const getMissingDocuments = () => {
    const missing: string[] = [];
    if (!uploadState.id) missing.push('ID');
    if (!uploadState.proofOfAddress) missing.push('Proof of Address');
    if (!uploadState.creditReport) missing.push('Credit Report');
    return missing;
  };

  const fetchExistingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const newState: DocumentUploadState = {
        id: null,
        proofOfAddress: null,
        creditReport: null,
      };

      data.forEach((doc: ProcessedDocument) => {
        if (doc.type === 'ID') newState.id = doc;
        else if (doc.type === 'Proof of Address') newState.proofOfAddress = doc;
        else if (doc.type === 'Credit Report') newState.creditReport = doc;
      });

      setUploadState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  };

  return {
    uploadState,
    isLoading,
    error,
    uploadDocument,
    isIntakeComplete,
    getMissingDocuments,
    fetchExistingDocuments,
  };
}; 