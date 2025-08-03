import api from './api';
import { Document, DocumentAnalysisResult } from '../types/document';

interface UploadDocumentParams {
  title: string;
  description?: string;
  file: File;
}

const documentService = {
  // Upload a document
  uploadDocument: async (params: UploadDocumentParams): Promise<Document> => {
    const formData = new FormData();
    formData.append('title', params.title);
    
    if (params.description) {
      formData.append('description', params.description);
    }
    
    formData.append('file', params.file);
    
    const response = await api.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  // Get all documents
  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents/list');
    return response.data;
  },

  // Get a specific document
  getDocument: async (documentId: string): Promise<Document> => {
    const response = await api.get<Document>(`/documents/${documentId}`);
    return response.data;
  },

  // Analyze a document
  analyzeDocument: async (documentId: string): Promise<DocumentAnalysisResult> => {
    const response = await api.post<DocumentAnalysisResult>(`/documents/${documentId}/analyze`);
    return response.data;
  }
};

export default documentService;
