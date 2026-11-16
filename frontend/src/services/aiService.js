import api from './api';

export const sendChatMessage = (message, conversationHistory = []) =>
  api.post('/ai/chat', { message, conversationHistory }, { timeout: 35000 });

export const generateAIRecipe = (data) =>
  api.post('/ai/recipes/generate', data, { timeout: 35000 });

export const getAIRecommendations = (data) =>
  api.post('/ai/recommendations', data, { timeout: 35000 });
