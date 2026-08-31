import apiClient from "./apiClient";

export const PANTRY_ENDPOINTS = {
  PANTRIES: "/pantries",
  ITEMS: (pantryId) => `/pantries/${pantryId}/items`,
  ITEM_BY_ID: (pantryId, itemId) => `/pantries/${pantryId}/items/${itemId}`,
  EXPIRY_ALERTS: "/pantries/expiry/alerts",
  LOW_STOCK_ALERTS: "/pantries/low-stock/alerts",
};

export const pantryService = {
  /**
   * Fetch all pantries for the current user
   */
  async getPantries() {
    const response = await apiClient.get(PANTRY_ENDPOINTS.PANTRIES);
    return response.data;
  },

  /**
   * Create a new pantry
   * @param {Object} pantryData - { name, location }
   */
  async createPantry(pantryData) {
    const response = await apiClient.post(PANTRY_ENDPOINTS.PANTRIES, pantryData);
    return response.data;
  },

  /**
   * Fetch all items in a given pantry
   * @param {string} pantryId
   * @param {Object} params - { category, search, page, limit }
   */
  async getPantryItems(pantryId, params = {}) {
    const response = await apiClient.get(PANTRY_ENDPOINTS.ITEMS(pantryId), {
      params,
    });
    return response.data;
  },

  /**
   * Add a new item to a pantry
   * @param {string} pantryId
   * @param {Object} itemData - { name, quantity, unit, category, expiryDate, lowStockThreshold }
   */
  async addItem(pantryId, itemData) {
    const response = await apiClient.post(
      PANTRY_ENDPOINTS.ITEMS(pantryId),
      itemData
    );
    return response.data;
  },

  /**
   * Update an existing pantry item
   * @param {string} pantryId
   * @param {string} itemId
   * @param {Object} updateData
   */
  async updateItem(pantryId, itemId, updateData) {
    const response = await apiClient.put(
      PANTRY_ENDPOINTS.ITEM_BY_ID(pantryId, itemId),
      updateData
    );
    return response.data;
  },

  /**
   * Delete an item from a pantry
   * @param {string} pantryId
   * @param {string} itemId
   */
  async deleteItem(pantryId, itemId) {
    const response = await apiClient.delete(
      PANTRY_ENDPOINTS.ITEM_BY_ID(pantryId, itemId)
    );
    return response.data;
  },

  /**
   * Fetch items expiring soon across all user pantries
   * @param {number} days
   */
  async getExpiringSoon(days = 3) {
    const response = await apiClient.get(PANTRY_ENDPOINTS.EXPIRY_ALERTS, {
      params: { days },
    });
    return response.data;
  },

  /**
   * Fetch low stock items
   */
  async getLowStock() {
    const response = await apiClient.get(PANTRY_ENDPOINTS.LOW_STOCK_ALERTS);
    return response.data;
  },
};

export default pantryService;
