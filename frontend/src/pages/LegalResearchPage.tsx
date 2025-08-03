import React, { useState } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';

// Type definition for case law results
interface CaseLawResult {
  title: string;
  court: string;
  year: number;
  summary: string;
  relevance: number;
  url?: string;
}

const LegalResearchPage: React.FC = () => {
  const [keywords, setKeywords] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const [yearStart, setYearStart] = useState<string>('');
  const [yearEnd, setYearEnd] = useState<string>('');
  const [results, setResults] = useState<CaseLawResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keywords.trim() || !jurisdiction.trim()) {
      setError('Keywords and jurisdiction are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the search parameters
      const searchParams = {
        keywords: keywords.split(' ').filter(k => k.trim() !== ''),
        jurisdiction,
        year_range: yearStart && yearEnd ? [parseInt(yearStart), parseInt(yearEnd)] : undefined
      };
      
      // Call the API (not implemented here)
      // const response = await legalService.searchCaseLaw(searchParams);
      // setResults(response);
      
      // Mock results for demo purposes
      setTimeout(() => {
        setResults([
          {
            title: 'Smith v. Jones',
            court: 'Supreme Court',
            year: 2022,
            summary: 'The court ruled in favor of the plaintiff, establishing a precedent for similar contractual disputes.',
            relevance: 0.95
          },
          {
            title: 'United States v. Miller',
            court: 'Court of Appeals',
            year: 2021,
            summary: 'The defendant\'s appeal was denied based on the legal principle of estoppel.',
            relevance: 0.85
          }
        ]);
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error('Error searching case law:', err);
      setError('Failed to perform search. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Legal Research</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Case Law</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                id="keywords"
                type="text"
                className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter search terms"
              />
            </div>
            
            <div>
              <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <select
                id="jurisdiction"
                className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              >
                <option value="">Select Jurisdiction</option>
                <option value="US-Federal">US Federal</option>
                <option value="US-State">US State</option>
                <option value="UK">United Kingdom</option>
                <option value="EU">European Union</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="yearStart" className="block text-sm font-medium text-gray-700 mb-1">
                  Year From
                </label>
                <input
                  id="yearStart"
                  type="number"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                  placeholder="Start year"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              
              <div>
                <label htmlFor="yearEnd" className="block text-sm font-medium text-gray-700 mb-1">
                  Year To
                </label>
                <input
                  id="yearEnd"
                  type="number"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value)}
                  placeholder="End year"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Searching...' : 'Search Case Law'}
              </Button>
            </div>
          </form>
        </div>
        
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            
            <div className="space-y-6">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-blue-700">{result.title}</h3>
                    <span className="text-sm text-gray-500">Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {result.court}, {result.year}
                  </div>
                  
                  <p className="mt-2 text-gray-700">{result.summary}</p>
                  
                  {result.url && (
                    <a 
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                    >
                      Read full case →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-500">
          <p>
            <strong>Disclaimer:</strong> The legal research information provided is for educational purposes only and does not constitute legal advice.
            For advice specific to your situation, please consult with a qualified attorney.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LegalResearchPage;
