import api from './api';
import { 
  LegalQuery, 
  LegalResponse, 
  CaseLawQuery, 
  CaseLawResult 
} from '../types/legal';

const legalService = {
  // Send a legal query
  sendLegalQuery: async (query: LegalQuery): Promise<LegalResponse> => {
    const response = await api.post<LegalResponse>('/legal/query', query);
    return response.data;
  },

  // Search case law
  searchCaseLaw: async (
    query: CaseLawQuery, 
    limit: number = 10
  ): Promise<CaseLawResult[]> => {
    const response = await api.post<CaseLawResult[]>('/legal/case-law', query, {
      params: { limit }
    });
    return response.data;
  }
};

export default legalService;
