import apiClient from "./apiClient";

export const SHOPPING_LIST_ENDPOINTS = {
  LIST: "/shopping-list",
  ITEMS: "/shopping-list/items",
  ITEM_BY_ID: (itemId) => `/shopping-list/items/${itemId}`,
  CLEAR_PURCHASED: "/shopping-list/clear-purchased",
};

export const shoppingListService = {
  /**
   * Fetch current user's shopping list and items
   */
  async getShoppingList() {
    const response = await apiClient.get(SHOPPING_LIST_ENDPOINTS.LIST);
    return response.data;
  },

  /**
   * Add a single item to shopping list
   * @param {Object} itemData - { name, quantity, unit, estimatedCost, recipeId }
   */
  async addItem(itemData) {
    const response = await apiClient.post(
      SHOPPING_LIST_ENDPOINTS.ITEMS,
      itemData
    );
    return response.data;
  },

  /**
   * Update a shopping list item
   * @param {string} itemId
   * @param {Object} updateData - { isPurchased, quantity, unit }
   */
  async updateItem(itemId, updateData) {
    const response = await apiClient.patch(
      SHOPPING_LIST_ENDPOINTS.ITEM_BY_ID(itemId),
      updateData
    );
    return response.data;
  },

  /**
   * Delete an item from shopping list
   * @param {string} itemId
   */
  async deleteItem(itemId) {
    const response = await apiClient.delete(
      SHOPPING_LIST_ENDPOINTS.ITEM_BY_ID(itemId)
    );
    return response.data;
  },
};

export default shoppingListService;

