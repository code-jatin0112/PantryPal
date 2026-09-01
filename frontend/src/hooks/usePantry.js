import { useState, useEffect, useCallback } from 'react';
import { getPantries, createPantry, getPantryItems, getExpiringItems, getLowStockItems } from '../services/pantryService';

export const usePantry = () => {
  const [pantries, setPantries] = useState([]);
  const [activePantry, setActivePantry] = useState(null);
  const [items, setItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPantries = useCallback(async () => {
    try {
      const res = await getPantries();
      const list = res.data.data.pantries || [];
      setPantries(list);
      if (list.length > 0 && !activePantry) {
        setActivePantry(list[0]);
      }
    } catch (err) {
      setError('Failed to load pantries.');
    }
  }, []);

  const fetchItems = useCallback(async (pantryId) => {
    if (!pantryId) return;
    setLoading(true);
    try {
      const [itemsRes, expiringRes, lowStockRes] = await Promise.all([
        getPantryItems(pantryId),
        getExpiringItems(pantryId, 7),
        getLowStockItems(pantryId),
      ]);
      setItems(itemsRes.data.data.items || []);
      setExpiringItems(expiringRes.data.data.items || []);
      setLowStockItems(lowStockRes.data.data.items || []);
    } catch (err) {
      setError('Failed to load pantry items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPantries();
  }, [fetchPantries]);

  useEffect(() => {
    if (activePantry?.id) {
      fetchItems(activePantry.id);
    }
  }, [activePantry, fetchItems]);

  const refresh = () => {
    if (activePantry?.id) fetchItems(activePantry.id);
  };

  return {
    pantries, activePantry, setActivePantry,
    items, expiringItems, lowStockItems,
    loading, error, refresh, fetchPantries,
  };
};
