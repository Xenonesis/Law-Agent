import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DocumentUploader from '../components/DocumentUploader';
import Button from '../components/Button';
import { Document, DocumentAnalysisResult } from '../types/document';
import documentService from '../services/documentService';

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingDocument, setUploadingDocument] = useState<boolean>(false);
  const [analyzingDocument, setAnalyzingDocument] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [showUploader, setShowUploader] = useState<boolean>(false);

  useEffect(() => {
    // Load documents on component mount
    const fetchDocuments = async () => {
      try {
        const docs = await documentService.getDocuments();
        setDocuments(docs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleUploadDocument = async (file: File, title: string, description?: string) => {
    setUploadingDocument(true);
    
    try {
      // Upload document
      const newDocument = await documentService.uploadDocument({
        file,
        title,
        description
      });
      
      setDocuments((prevDocs) => [...prevDocs, newDocument]);
      setShowUploader(false);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleAnalyzeDocument = async (document: Document) => {
    setSelectedDocument(document);
    setAnalyzingDocument(true);
    
    try {
      // Analyze document
      const result = await documentService.analyzeDocument(document.id);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      setAnalyzingDocument(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Layout>
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Legal Documents</h1>
            <p className="text-neutral-600">
              Upload and analyze your legal documents
            </p>
          </div>
          
          <Button
            onClick={() => setShowUploader(!showUploader)}
            variant={showUploader ? 'outline' : 'primary'}
          >
            {showUploader ? 'Cancel' : 'Upload New Document'}
          </Button>
        </div>
        
        {showUploader && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <DocumentUploader
              onUpload={handleUploadDocument}
              isLoading={uploadingDocument}
            />
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 ${selectedDocument ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
              {documents.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md border border-neutral-200 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium mt-4">No Documents Yet</h3>
                  <p className="text-neutral-500 mt-2">
                    Upload your first document to get started
                  </p>
                  <Button
                    onClick={() => setShowUploader(true)}
                    className="mt-4"
                  >
                    Upload Document
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200">
                    <h2 className="font-semibold">Your Documents</h2>
                  </div>
                  <ul className="divide-y divide-neutral-200">
                    {documents.map((doc) => (
                      <li 
                        key={doc.id}
                        className={`px-6 py-4 cursor-pointer transition-colors hover:bg-neutral-50 ${
                          selectedDocument?.id === doc.id ? 'bg-primary-50' : ''
                        }`}
                        onClick={() => handleAnalyzeDocument(doc)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-neutral-900">{doc.title}</h3>
                            {doc.description && (
                              <p className="text-sm text-neutral-500 mt-1">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                              Uploaded on {formatDate(doc.createdAt)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedDocument?.id === doc.id ? 'primary' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeDocument(doc);
                            }}
                            isLoading={analyzingDocument && selectedDocument?.id === doc.id}
                          >
                            {selectedDocument?.id === doc.id ? 'Analyzing...' : 'Analyze'}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {selectedDocument && (
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                    <h2 className="font-semibold">Document Analysis</h2>
                    <button
                      onClick={() => {
                        setSelectedDocument(null);
                        setAnalysisResult(null);
                      }}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="px-6 py-4">
                    <h3 className="font-medium text-lg">{selectedDocument.title}</h3>
                    
                    {analyzingDocument ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-neutral-600">Analyzing document...</p>
                      </div>
                    ) : analysisResult ? (
                      <div className="mt-4 space-y-6">
                        <div>
                          <h4 className="font-medium text-neutral-900">Summary</h4>
                          <p className="mt-2 text-neutral-700 bg-neutral-50 p-3 rounded">
                            {analysisResult.summary}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-neutral-900">Key Points</h4>
                          <ul className="mt-2 list-disc list-inside space-y-1">
                            {analysisResult.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-neutral-700">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-neutral-900">Legal Entities</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {analysisResult.entities.map((entity, idx) => (
                              <span
                                key={idx}
                                className={`
                                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${entity.label === 'ORG' ? 'bg-blue-100 text-blue-800' :
                                    entity.label === 'PERSON' ? 'bg-green-100 text-green-800' :
                                    entity.label === 'GPE' ? 'bg-yellow-100 text-yellow-800' :
                                    entity.label === 'LAW' ? 'bg-purple-100 text-purple-800' :
                                    entity.label === 'DATE' ? 'bg-gray-100 text-gray-800' :
                                    entity.label === 'MONEY' ? 'bg-red-100 text-red-800' :
                                    'bg-neutral-100 text-neutral-800'}
                                `}
                              >
                                {entity.text}
                                <span className="ml-1 text-[10px] opacity-70">
                                  {entity.label}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {analysisResult.recommendations && (
                          <div>
                            <h4 className="font-medium text-neutral-900">Recommendations</h4>
                            <ul className="mt-2 list-disc list-inside space-y-1">
                              {analysisResult.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-neutral-700">
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <p className="text-neutral-500">Select "Analyze" to process this document</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 text-sm text-neutral-500">
          <p>
            <strong>Note:</strong> For best results, upload clear, well-formatted documents in PDF format.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default DocumentsPage;
