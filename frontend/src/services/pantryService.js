import api from './api';
import { PANTRY } from '../constants/api';

// ── Pantry Containers CRUD ─────────────────────────────────
export const getPantries = () => api.get(PANTRY.LIST);
export const createPantry = (data) => api.post(PANTRY.CREATE, data);
export const deletePantry = (pantryId) => api.delete(PANTRY.DELETE(pantryId));

// ── Pantry Items CRUD ──────────────────────────────────────
export const getPantryItems = (pantryId) => api.get(PANTRY.ITEMS(pantryId));
export const getPantryItemById = (pantryId, itemId) => api.get(PANTRY.ITEM(pantryId, itemId));
export const createPantryItem = (pantryId, data) => api.post(PANTRY.ITEMS(pantryId), data);
export const updatePantryItem = (pantryId, itemId, data) => api.patch(PANTRY.ITEM(pantryId, itemId), data);
export const deletePantryItem = (pantryId, itemId) => api.delete(PANTRY.ITEM(pantryId, itemId));
export const adjustStock = (pantryId, itemId, data) => api.post(PANTRY.ITEM_ADJUST(pantryId, itemId), data);

// ── Alerts & Status Queries ────────────────────────────────
export const getExpiringItems = (pantryId, days = 7) => api.get(PANTRY.EXPIRING(pantryId, days));
export const getExpiredItems = (pantryId) => api.get(PANTRY.EXPIRED(pantryId));
export const getLowStockItems = (pantryId) => api.get(PANTRY.LOW_STOCK(pantryId));
