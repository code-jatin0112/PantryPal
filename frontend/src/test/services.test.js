import { describe, it, expect, vi } from 'vitest';
import * as API_ENDPOINTS from '../constants/api';
import { getErrorMessage, isNetworkError, isAuthError } from '../utils/errorHandler';
import api from '../services/api';
import { getAIRecommendations } from '../services/aiRecommendationService';

describe('Centralized API Services & Error Normalization Test Suite', () => {
  it('defines all centralized endpoint constants without hardcoded base URLs', () => {
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    expect(API_ENDPOINTS.PANTRY.LIST).toBe('/pantries');
    expect(API_ENDPOINTS.PANTRY.ITEMS('p-123')).toBe('/pantries/p-123/items');
    expect(API_ENDPOINTS.RECIPES.LIST).toBe('/recipes');
    expect(API_ENDPOINTS.RECIPES.DETAIL('r-456')).toBe('/recipes/r-456');
    expect(API_ENDPOINTS.SHOPPING.LIST).toBe('/shopping-list');
    expect(API_ENDPOINTS.MEAL_PLANS.LIST).toBe('/meal-plans');
    expect(API_ENDPOINTS.AI.RECOMMENDATIONS).toBe('/ai/recommendations');
    expect(API_ENDPOINTS.AI.CHAT).toBe('/ai/chat');
    expect(API_ENDPOINTS.PREFERENCES.GET).toBe('/preferences');
  });

  it('normalizes network errors into friendly user messages', () => {
    const networkError = { message: 'Network Error' };
    expect(isNetworkError(networkError)).toBe(true);
    expect(getErrorMessage(networkError)).toBe('Unable to connect to the server. Please check your internet connection.');

    const backendError = {
      response: {
        data: { message: 'Invalid credentials provided.' },
        status: 401,
      },
    };
    expect(isAuthError(backendError)).toBe(true);
    expect(getErrorMessage(backendError)).toBe('Invalid credentials provided.');
  });

  it('passes a 35,000ms timeout option to api.post in getAIRecommendations', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        data: {
          recommendations: [{ id: 'rec-1', title: 'Pasta Primavera' }],
        },
      },
    });

    const result = await getAIRecommendations({ pantryId: 'p1' });

    expect(postSpy).toHaveBeenCalledWith(
      '/ai/recommendations',
      { pantryId: 'p1' },
      { timeout: 35000 }
    );
    expect(result).toEqual([{ id: 'rec-1', title: 'Pasta Primavera' }]);
    postSpy.mockRestore();
  });
});
