import { useState } from 'react';

const BACKEND_URL = 'http://localhost:5000';

interface FinancialData {
  transactions: any[];
  income: number;
  expenses: number;
  question?: string;
}

interface FinancialAnalysisResponse {
  analysis: string;
  summary: {
    income: number;
    expenses: number;
    net: number;
    transaction_count: number;
  };
}

export const useFinancialAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFinancialData = async (data: FinancialData): Promise<FinancialAnalysisResponse | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/financial-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error analyzing financial data:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      return response.ok;
    } catch (err) {
      console.error('Backend health check failed:', err);
      return false;
    }
  };

  return {
    analyzeFinancialData,
    checkBackendHealth,
    isAnalyzing,
    error,
  };
};
