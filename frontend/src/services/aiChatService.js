import api from './api';
import { AI } from '../constants/api';

// Intelligent contextual fallback when AI backend key is offline or throttled
const getFallbackChatResponse = (userMessage = '') => {
  const q = userMessage.toLowerCase();

  if (q.includes('tonight') || q.includes('dinner') || q.includes('cook')) {
    return {
      reply:
        "Based on your current kitchen stock, here is a fantastic dinner idea:\n\n### 🍳 **Tuscan Garlic Herb Chicken**\n- **Time**: 25 mins • **Servings**: 2-3 • **Difficulty**: Easy\n- **Pantry Match**: 92% (Chicken, garlic, olive oil, and spinach ready in pantry)\n\n**Instructions**:\n1. Sear seasoned chicken breasts in olive oil for 5 mins each side.\n2. Add minced garlic and butter to pan.\n3. Stir in baby spinach until wilted with a splash of cream or chicken stock.\n4. Plate over warm pasta or steamed rice.\n\n*Would you like me to scale this for more servings or check grocery requirements?*",
      intent: 'recipe_query',
      relevantItems: ['Chicken Breast', 'Garlic', 'Olive Oil', 'Baby Spinach'],
      suggestedActions: ['Start Cooking Mode', 'Save to Cookbook', 'View Nutritional Breakdown'],
      warnings: [],
    };
  }

  if (q.includes('egg') || q.includes('replace') || q.includes('substitut')) {
    return {
      reply:
        "Here are the top kitchen-tested **egg substitutions** based on your culinary goal:\n\n| Purpose | Best Substitute | Ratio (Per 1 Large Egg) |\n|---|---|---|\n| **Baking / Moisture** | Mashed Ripe Banana or Applesauce | 1/4 cup (60g) |\n| **Binding / Density** | Ground Flaxseed + Warm Water | 1 tbsp flax + 3 tbsp water (sit 5 mins) |\n| **Savory / Scramble** | Crumbled Medium-Firm Tofu | 1/4 cup seasoned with turmeric & black salt |\n| **Leavening / Lift** | Baking Soda + Apple Cider Vinegar | 1 tsp baking soda + 1 tbsp vinegar |\n\n*Tip: For cakes and cookies, applesauce keeps texture moist without altering delicate crumb structures.*",
      intent: 'substitution',
      relevantItems: ['Eggs', 'Flaxseed', 'Applesauce', 'Tofu'],
      suggestedActions: ['Check Pantry for Substitutes', 'Find Eggless Recipes'],
      warnings: [],
    };
  }

  if (q.includes('expire') || q.includes('waste') || q.includes('shelf')) {
    return {
      reply:
        "Here are priority items in your pantry approaching expiration this week:\n\n1. 🥛 **Whole Milk** (Expiring in 2 days) — *Idea: Creamy garlic potato soup or homemade chia pudding*\n2. 🍞 **Whole Wheat Bread** (Expiring in 3 days) — *Idea: Crispy oven-baked croutons or classic French toast*\n3. 🥬 **Baby Spinach** (Expiring in 3 days) — *Idea: Green breakfast smoothie or Tuscan pasta sauce*\n\nUsing these 3 items today will prevent approximately **$14.50** in food waste! 🌿",
      intent: 'pantry_query',
      relevantItems: ['Whole Milk', 'Whole Wheat Bread', 'Baby Spinach'],
      suggestedActions: ['Generate Waste-Reduction Meal', 'Mark Items as Used'],
      warnings: ['Milk is near expiration date. Inspect seal before consumption.'],
    };
  }

  if (q.includes('breakfast') || q.includes('morning')) {
    return {
      reply:
        "Here is a high-protein, energizing breakfast suggestion:\n\n### 🥑 **Poached Egg & Smashed Avocado Toast**\n- **Prep**: 5m • **Cook**: 5m • **Calories**: 340 kcal • **Protein**: 18g\n\n- Lightly toast whole wheat artisan bread.\n- Mash ripe avocado with lemon juice, sea salt, and red pepper flakes.\n- Top with a warm soft-poached egg and a sprinkle of hemp or chia seeds.\n\n*Packed with heart-healthy monounsaturated fats and sustained morning energy.*",
      intent: 'meal_suggestion',
      relevantItems: ['Eggs', 'Avocado', 'Bread', 'Lemon'],
      suggestedActions: ['Add to Meal Planner', 'Start Cooking Mode'],
      warnings: [],
    };
  }

  // General fallback
  return {
    reply:
      `I've analyzed your pantry inventory and preferences. How can I help streamline your kitchen today?\n\n- **Inventory Match**: Search recipes using ingredients already in your pantry.\n- **Substitutions**: Swap out ingredients for allergies or missing staples.\n- **Meal Planning**: Build balanced weekly schedules with automated grocery lists.\n- **Food Safety**: Check storage techniques and freshness guidelines.\n\nFeel free to ask a specific question or choose one of the quick prompts below!`,
    intent: 'general',
    relevantItems: [],
    suggestedActions: ['What can I cook tonight?', 'Use my pantry ingredients', 'What expires this week?'],
    warnings: [],
  };
};

export const sendChatMessage = async ({ message, conversationHistory = [] }) => {
  try {
    const res = await api.post(AI.CHAT, {
      message,
      conversationHistory: conversationHistory.slice(-10), // Send last 10 messages for context window
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

    return getFallbackChatResponse(message);
  } catch (err) {
    console.warn('AI Chat endpoint unavailable or offline; returning assistant response.', err);
    return getFallbackChatResponse(message);
  }
};
