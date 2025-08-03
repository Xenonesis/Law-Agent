import React, { useState } from 'react';

interface DocumentUploaderProps {
  onUpload: (file: File, title: string, description?: string) => Promise<void>;
  isLoading?: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onUpload, 
  isLoading = false 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (file && title) {
      await onUpload(file, title, description);
      // Reset form after upload
      setFile(null);
      setTitle('');
      setDescription('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <label 
          htmlFor="title" 
          className="block mb-2 text-sm font-medium text-neutral-700"
        >
          Document Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <label 
          htmlFor="description" 
          className="block mb-2 text-sm font-medium text-neutral-700"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter document description"
          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          rows={3}
        />
      </div>
      
      <div className="mb-6">
        <label 
          htmlFor="file" 
          className="block mb-2 text-sm font-medium text-neutral-700"
        >
          Upload Document *
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full border-2 border-dashed p-6 rounded-md text-center cursor-pointer
            transition-colors
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'}
          `}
        >
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            required
          />
          
          {file ? (
            <div className="text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <p className="mt-2 font-medium">{file.name}</p>
              <p className="text-sm text-neutral-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <label htmlFor="file" className="cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <p className="mt-2 text-neutral-700">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                PDF, DOC, DOCX or TXT files up to 10MB
              </p>
            </label>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!file || !title || isLoading}
        className={`
          w-full py-2 px-4 rounded-md text-white font-medium transition-colors
          ${!file || !title || isLoading
            ? 'bg-neutral-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700'}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : (
          'Upload Document'
        )}
      </button>
    </form>
  );
};

export default DocumentUploader;
