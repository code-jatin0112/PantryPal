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
      let list = res.data.data.pantries || [];

      // Auto-provision a default pantry if the user doesn't have one yet
      if (list.length === 0) {
        try {
          const createRes = await createPantry({ name: 'My Kitchen' });
          const newPantry = createRes.data.data.pantry;
          if (newPantry) {
            list = [newPantry];
          }
        } catch (createErr) {
          console.error("Auto-provision pantry error:", createErr);
        }
      }

      setPantries(list);
      if (list.length > 0) {
        setActivePantry(prev => prev || list[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load pantries.');
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async (pantryId) => {
    if (!pantryId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [itemsRes, expiringRes, lowStockRes] = await Promise.all([
        getPantryItems(pantryId),
        getExpiringItems(pantryId, 7).catch(() => ({ data: { data: { items: [] } } })),
        getLowStockItems(pantryId).catch(() => ({ data: { data: { items: [] } } })),
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
    if (activePantry?.id) {
      fetchItems(activePantry.id);
    } else {
      fetchPantries();
    }
  };

  return {
    pantries, activePantry, setActivePantry,
    items, expiringItems, lowStockItems,
    loading, error, refresh, fetchPantries,
  };
};
