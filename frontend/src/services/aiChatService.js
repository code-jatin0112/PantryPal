import api from './api';
import { AI } from '../constants/api';

/**
 * Send chat message to backend AI Assistant
 */
export const sendChatMessage = async ({ message, conversationHistory = [] }) => {
  try {
    const res = await api.post(AI.CHAT, {
      message,
      conversationHistory: conversationHistory.slice(-10),
    });

    const data = res.data?.data;
    if (data && (data.reply || data.answer)) {
      return {
        reply: data.reply || data.answer,
        intent: data.intent || 'general',
        relevantItems: data.relevantItems || [],
        suggestedActions: data.suggestedActions || [],
        warnings: data.warnings || [],
      };
    }

    return {
      reply: typeof data === 'string' ? data : 'I received your request.',
      intent: 'general',
      relevantItems: [],
      suggestedActions: [],
      warnings: [],
    };
  } catch (err) {
    console.error('AI Chat request failed:', err);
    throw err;
  }
};
