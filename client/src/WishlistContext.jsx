import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

const Ctx = createContext({
  items: [],
  ids: new Set(),
  loading: false,
  isSaved: () => false,
  toggle: async () => false,
  reload: async () => {},
});

export const useWishlist = () => useContext(Ctx);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await api('/wishlists'));
    } catch {
      /* keep the previous list */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const ids = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  // toggle(listing) or toggle(listingId). Pass the listing object for the smoothest optimistic update.
  const toggle = useCallback(
    async (target) => {
      if (!user) {
        navigate('/login', { state: { from: loc.pathname } });
        return false;
      }
      const id = typeof target === 'object' ? target.id : target;
      const wasSaved = ids.has(id);
      setItems((prev) => (wasSaved ? prev.filter((i) => i.id !== id) : typeof target === 'object' ? [target, ...prev] : prev));
      try {
        const res = await api('/wishlists', { method: 'POST', body: { listingId: id } });
        if (typeof target !== 'object') await reload();
        return res.saved;
      } catch {
        await reload(); // undo the optimistic change
        return wasSaved;
      }
    },
    [user, ids, navigate, loc.pathname, reload]
  );

  const value = useMemo(() => ({ items, ids, loading, isSaved: (id) => ids.has(id), toggle, reload }), [items, ids, loading, toggle, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
