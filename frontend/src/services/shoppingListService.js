import api from './api';
import { SHOPPING } from '../constants/api';

// ── Shopping List CRUD ─────────────────────────────────────
export const getShoppingList = (params = {}) => {
  const query = params.isPurchased !== undefined ? `?isPurchased=${params.isPurchased}` : '';
  return api.get(`${SHOPPING.LIST}${query}`);
};

export const getShoppingListItem = (id) =>
  api.get(SHOPPING.ITEM(id));

export const createShoppingListItem = (data) =>
  api.post(SHOPPING.CREATE, data);

export const updateShoppingListItem = (id, data) =>
  api.patch(SHOPPING.ITEM(id), data);

export const deleteShoppingListItem = (id) =>
  api.delete(SHOPPING.ITEM(id));

export const clearPurchasedItems = () =>
  api.delete(SHOPPING.CLEAR_PURCHASED);
