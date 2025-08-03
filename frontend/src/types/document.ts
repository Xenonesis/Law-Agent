export interface Document {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  keyPoints: string[];
  entities: DocumentEntity[];
  recommendations?: string[];
}

export interface DocumentEntity {
  text: string;
  label: string;
  start?: number;
  end?: number;
}
