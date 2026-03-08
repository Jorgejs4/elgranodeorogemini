import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// URL Base para la API (Local para desarrollo)
const API_BASE_URL = 'http://localhost:8000';

const useStore = create(
  persist(
    (set, get) => ({
      // --- ESTADO ---
      user: null,
      products: [],
      recommendations: [],
      cart: [],
      wishlist: [],
      orders: [],
      aiInsights: null,

      // --- ACCIONES DE USUARIO ---
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null, cart: [], wishlist: [] });
        localStorage.removeItem('user');
      },

      // --- ACCIONES DE PRODUCTOS ---
      setProducts: (products) => set({ products }),
      setRecommendations: (recommendations) => set({ recommendations }),
      fetchProducts: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/products/?skip=0&limit=100`);
          const data = await res.json();
          set({ products: Array.isArray(data) ? data : [] });
        } catch (err) {
          console.error('Error fetching products:', err);
        }
      },

      // --- ACCIONES DE CARRITO ---
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
      },
      clearCart: () => set({ cart: [] }),

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
