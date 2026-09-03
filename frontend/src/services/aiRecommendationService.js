import api from './api';
import { AI } from '../constants/api';

/**
 * Fetch AI Recipe Recommendations strictly from the backend
 */
export const getAIRecommendations = async (payload) => {
  try {
    const res = await api.post(AI.RECOMMENDATIONS, payload);
    const data = res.data?.data;
    if (data && Array.isArray(data.recommendations)) {
      return data.recommendations;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error('Failed to generate AI recommendations from backend:', err);
    throw err;
  }
};
