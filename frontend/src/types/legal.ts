export interface LegalQuery {
  question: string;
  jurisdiction?: string;
}

export interface LegalResponse {
  answer: string;
  sources?: string[];
  disclaimer: string;
  confidence?: number;
}

export interface CaseLawQuery {
  keywords: string[];
  jurisdiction: string;
  yearRange?: [number, number];
}

export interface CaseLawResult {
  title: string;
  court: string;
  year: number;
  summary: string;
  relevance: number;
  url?: string;
}
