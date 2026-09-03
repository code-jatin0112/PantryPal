import api from './api';
import { MEAL_PLANS, SHOPPING } from '../constants/api';

export const getMealPlans         = ()         => api.get(MEAL_PLANS.LIST);
export const getShoppingList      = ()         => api.get(SHOPPING.LIST);
export const updateShoppingListItem = (id, data) => api.patch(SHOPPING.ITEM(id), data);
export const clearPurchasedItems  = ()         => api.delete(SHOPPING.CLEAR_PURCHASED);
