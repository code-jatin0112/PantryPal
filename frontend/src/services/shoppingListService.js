import api from './api';
import { SHOPPING } from '../constants/api';

export const getShoppingList     = ()         => api.get(SHOPPING.LIST);
export const createShoppingItem  = (data)     => api.post(SHOPPING.CREATE, data);
export const updateShoppingItem  = (id, data) => api.patch(SHOPPING.ITEM(id), data);
export const deleteShoppingItem  = (id)       => api.delete(SHOPPING.ITEM(id));
export const clearPurchasedItems = ()         => api.delete(SHOPPING.CLEAR_PURCHASED);
