import { useState, useCallback } from 'react';
import { 
  calculateAIScholarshipScores, 
  calculateAICollegeScores, 
  AIMatchScoreResult 
} from '@/lib/scholarshipsIntel/api';
import { toast } from 'sonner';

interface UseAIMatchScoresReturn {
  scores: Record<string, AIMatchScoreResult>;
  loading: boolean;
  error: string | null;
  calculateScholarshipScores: (scholarshipIds: string[]) => Promise<void>;
  calculateCollegeScores: (collegeIds: string[]) => Promise<void>;
  getScore: (id: string) => AIMatchScoreResult | undefined;
}

export function useAIMatchScores(): UseAIMatchScoresReturn {
  const [scores, setScores] = useState<Record<string, AIMatchScoreResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateScholarshipScores = useCallback(async (scholarshipIds: string[]) => {
    // Filter out already-calculated IDs
    const newIds = scholarshipIds.filter(id => !scores[id]);
    if (newIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { results, error: apiError } = await calculateAIScholarshipScores(newIds);
      
      if (apiError) {
        setError(apiError);
        if (apiError.includes('Rate limit')) {
          toast.error('AI rate limit reached. Please wait and try again.');
        } else if (apiError.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          toast.error('Failed to calculate match scores');
        }
        return;
      }

      setScores(prev => ({ ...prev, ...results }));
    } catch (err) {
      console.error('Error calculating scores:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [scores]);

  const calculateCollegeScores = useCallback(async (collegeIds: string[]) => {
    const newIds = collegeIds.filter(id => !scores[id]);
    if (newIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { results, error: apiError } = await calculateAICollegeScores(newIds);
      
      if (apiError) {
        setError(apiError);
        if (apiError.includes('Rate limit')) {
          toast.error('AI rate limit reached. Please wait and try again.');
        } else if (apiError.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          toast.error('Failed to calculate admission scores');
        }
        return;
      }

      setScores(prev => ({ ...prev, ...results }));
    } catch (err) {
      console.error('Error calculating scores:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [scores]);

  const getScore = useCallback((id: string) => scores[id], [scores]);

  return {
    scores,
    loading,
    error,
    calculateScholarshipScores,
    calculateCollegeScores,
    getScore,
  };
}
