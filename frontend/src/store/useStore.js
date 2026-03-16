import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// URL Base para la API (Usa variable de entorno o fallback a local)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const useStore = create(
  persist(
    (set, get) => ({
      // --- ESTADO ---
      user: null,
      products: [],
      isLoadingProducts: true,
      recommendations: [],
      cart: [],
      wishlist: [],
      orders: [],
      aiInsights: null,

      // --- ACCIONES DE USUARIO ---
      setUser: (user) => {
        set({ user });
        if (user) {
          get().fetchCart(user.token);
        }
      },
      logout: () => {
        set({ user: null, cart: [], wishlist: [] });
        localStorage.removeItem('user');
      },

      // --- ACCIONES DE PRODUCTOS ---
      setProducts: (products) => set({ products }),
      setRecommendations: (recommendations) => set({ recommendations }),
      fetchProducts: async () => {
        set({ isLoadingProducts: true });
        try {
          const res = await fetch(`${API_BASE_URL}/products/?skip=0&limit=100`);
          const data = await res.json();
          set({ products: Array.isArray(data) ? data : [], isLoadingProducts: false });
        } catch (err) {
          console.error('Error fetching products:', err);
          set({ isLoadingProducts: false });
        }
      },

      // --- ACCIONES DE CARRITO ---
      fetchCart: async (token) => {
        try {
          const res = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Data comes as [{ product: {...}, quantity: 2 }]
            // We need to map it to the store format: [{ id, name, price, qty }]
            const mappedCart = data.map(item => ({
              ...item.product,
              qty: item.quantity
            }));
            set({ cart: mappedCart });
          }
        } catch (err) {
          console.error("Error cargando carrito", err);
        }
      },
      syncCart: async () => {
        const { user, cart } = get();
        if (!user || !user.token) return; // Only sync if logged in
        
        const payload = {
          items: cart.map(c => ({ product_id: c.id, quantity: c.qty }))
        };
        
        fetch(`${API_BASE_URL}/cart/sync`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        }).catch(e => console.error("Error syncing cart", e));
      },
      addToCart: (product) => {
        const { cart } = get();
        const exist = cart.find((x) => x.id === product.id);
        if (exist) {
          set({
            cart: cart.map((x) =>
              x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x
            ),
          });
        } else {
          set({ cart: [...cart, { ...product, qty: 1 }] });
        }
        
        get().syncCart(); // Trigger background sync
        
        // Tracking opcional aquí
        fetch(`${API_BASE_URL}/track`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ product_id: product.id, action_type: 'add_to_cart' })
        }).catch(e => console.log(e));
      },
      removeFromCart: (product) => {
        const { cart } = get();
        const exist = cart.find((x) => x.id === product.id);
        if (!exist) return;
        if (exist.qty === 1) {
          set({ cart: cart.filter((x) => x.id !== product.id) });
        } else {
          set({
            cart: cart.map((x) =>
              x.id === product.id ? { ...exist, qty: exist.qty - 1 } : x
            ),
          });
        }
        get().syncCart(); // Trigger background sync
      },
      clearCart: () => {
        set({ cart: [] });
        get().syncCart();
      },

      // --- ACCIONES DE WISHLIST ---
      toggleWishlist: (product) => {
        const { wishlist } = get();
        if (wishlist.find((x) => x.id === product.id)) {
          set({ wishlist: wishlist.filter((x) => x.id !== product.id) });
        } else {
          set({ wishlist: [...wishlist, product] });
        }
      },

      // --- ACCIONES DE ADMIN ---
      setOrders: (orders) => set({ orders }),
      setAiInsights: (aiInsights) => set({ aiInsights }),
    }),
    {
      name: 'el-grano-de-oro-storage', // Nombre para localStorage
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist, user: state.user }), // Solo persistir esto
    }
  )
);

export default useStore;
export { API_BASE_URL };
