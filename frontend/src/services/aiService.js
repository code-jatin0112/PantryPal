import api from './api';

export const sendChatMessage = (message, conversationHistory = []) =>
  api.post('/ai/chat', { message, conversationHistory });

export const generateAIRecipe = (data) =>
  api.post('/ai/recipes/generate', data);

export const getAIRecommendations = (data) =>
  api.post('/ai/recommendations', data);
