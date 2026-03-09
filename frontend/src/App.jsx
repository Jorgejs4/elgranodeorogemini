import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import ProductCard from './ProductCard';
import ChatAssistant from './ChatAssistant';
import useStore, { API_BASE_URL } from './store/useStore';

// --- COMPONENTE DE RESEÑAS ---
const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const { user } = useStore();

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para dejar una reseña");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          user_name: user.email.split('@')[0],
          rating: newReview.rating,
          comment: newReview.comment
        })
      });
      if (res.ok) {
        toast.success("¡Gracias por tu opinión!");
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
      }
    } catch (e) { toast.error("Error al enviar reseña"); }
  };

  return (
    <div className="mt-16 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-xl">
      <h3 className="text-2xl font-serif font-bold text-white mb-8">Opiniones de los amantes del café</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lista de reseñas */}
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-700">
          {reviews.length === 0 ? (
            <p className="text-zinc-500 italic">Aún no hay reseñas. ¡Sé el primero en probar este café!</p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-amber-500 font-bold uppercase text-[10px] tracking-widest">{r.user_name}</span>
                  <div className="text-amber-400 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{r.comment}</p>
                <span className="text-zinc-600 text-[9px] block mt-4">{new Date(r.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        {/* Formulario de reseña */}
        <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800">
          <h4 className="text-lg font-bold text-white mb-4">Deja tu valoración</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2">Puntuación</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(num => (
                  <button key={num} type="button" onClick={() => setNewReview({...newReview, rating: num})} className={`w-10 h-10 rounded-lg border transition ${newReview.rating >= num ? 'bg-amber-600 border-amber-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold mb-2">Tu comentario</p>
              <textarea 
                className="premium-input w-full h-24 resize-none" 
                placeholder="¿Qué te ha parecido el aroma, el sabor...?" 
                value={newReview.comment}
                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="w-full bg-zinc-100 text-black font-bold py-3 rounded-xl hover:bg-amber-500 transition-all uppercase text-xs tracking-widest">Publicar Reseña</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE SELECTOR DE IDIOMAS ---
const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const languages = [
    { code: 'es', flag: 'https://flagcdn.com/es.svg', name: 'Español' },
    { code: 'en', flag: 'https://flagcdn.com/gb.svg', name: 'English' },
    { code: 'fr', flag: 'https://flagcdn.com/fr.svg', name: 'Français' },
    { code: 'de', flag: 'https://flagcdn.com/de.svg', name: 'Deutsch' },
    { code: 'it', flag: 'https://flagcdn.com/it.svg', name: 'Italiano' },
    { code: 'zh-CN', flag: 'https://flagcdn.com/cn.svg', name: '中文' }
  ];

  const [currentLangCode, setCurrentLangCode] = useState(() => {
    const name = 'googtrans';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieVal = decodeURIComponent(parts.pop().split(';').shift());
      return cookieVal.split('/').pop() || 'es';
    }
    return 'es';
  });

  const setLanguageCookie = (langCode) => {
    const domain = window.location.hostname;
    if (langCode === 'es') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
    } else {
      document.cookie = `googtrans=/es/${langCode}; path=/;`;
      document.cookie = `googtrans=/es/${langCode}; path=/; domain=.${domain}`;
    }
    setCurrentLangCode(langCode);
    window.location.reload(); 
  };

  const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

  return (
    <div className="relative mr-2 md:mr-4 flex items-center">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-500 transition-all shadow-lg overflow-hidden">
        <img src={currentLang.flag} alt={currentLang.name} className="w-6 h-6 object-cover rounded-full" />
      </button>
      {isOpen && (
        <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-2 w-40 z-50 animate-fade-in">
          {languages.map(lang => (
            <button key={lang.code} onClick={() => { setIsOpen(false); setLanguageCookie(lang.code); }} className={`w-full text-left px-4 py-2 hover:bg-zinc-800 transition flex items-center gap-3 ${currentLangCode === lang.code ? 'text-amber-500 font-bold bg-zinc-800/50' : 'text-zinc-300'}`}>
              <img src={lang.flag} alt={lang.name} className="w-5 h-5 object-cover rounded-full" />
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE GRÁFICO PREMIUM (CORREGIDO) ---
const SalesChart = ({ orders }) => {
  const [view, setView] = useState('weekly');
  
  const stats = useMemo(() => {
    if (!Array.isArray(orders)) return { data: [], summary: { today: 0, week: 0, month: 0, year: 0 } };
    const now = new Date();
    const startOfToday = new Date(new Date(now).setHours(0,0,0,0));
    const startOfWeek = new Date(new Date(now).setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const summary = {
        today: orders.filter(o => new Date(o.date) >= startOfToday).reduce((a,c) => a + c.total, 0),
        week: orders.filter(o => new Date(o.date) >= startOfWeek).reduce((a,c) => a + c.total, 0),
        month: orders.filter(o => new Date(o.date) >= startOfMonth).reduce((a,c) => a + c.total, 0),
        year: orders.filter(o => new Date(o.date) >= startOfYear).reduce((a,c) => a + c.total, 0),
    };

    let data = [];
    const today = new Date();
    if (view === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const total = orders.filter(o => new Date(o.date).toDateString() === d.toDateString()).reduce((a, c) => a + c.total, 0);
        data.push({ label: d.toLocaleDateString('es-ES', { weekday: 'short' }), val: total });
      }
    } else if (view === 'monthly') {
        for (let i = 25; i >= 0; i -= 5) {
            const d = new Date(today); d.setDate(today.getDate() - i);
            const total = orders.filter(o => new Date(o.date) >= new Date(new Date(d).setHours(0,0,0,0)) && new Date(o.date) <= new Date(new Date(d).setHours(23,59,59,999))).reduce((a, c) => a + c.total, 0);
            data.push({ label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), val: total });
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const total = orders.filter(o => new Date(o.date).getMonth() === d.getMonth() && new Date(o.date).getFullYear() === d.getFullYear()).reduce((a, c) => a + c.total, 0);
            data.push({ label: d.toLocaleDateString('es-ES', { month: 'short' }), val: total });
        }
    }
    return { data, summary };
  }, [orders, view]);

  if (!Array.isArray(orders) || orders.length === 0) return null;
  const maxVal = Math.max(...stats.data.map(d => d.val), 50);
  const points = stats.data.map((d, i) => {
    const x = (i / (stats.data.length - 1)) * 100;
    const y = 100 - (d.val / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* TARJETAS DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
              { label: 'Ingresos Hoy', val: stats.summary.today, icon: '☀️', color: 'from-amber-400 to-amber-600' },
              { label: 'Semana Actual', val: stats.summary.week, icon: '📅', color: 'from-blue-400 to-blue-600' },
              { label: 'Mes en Curso', val: stats.summary.month, icon: '📈', color: 'from-emerald-400 to-emerald-600' },
              { label: 'Total Anual', val: stats.summary.year, icon: '🏆', color: 'from-purple-400 to-purple-600' }
          ].map((card, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-600 transition-all duration-500 shadow-xl">
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{card.label}</span>
                          <span className="text-xl">{card.icon}</span>
                      </div>
                      <p className="text-3xl font-serif font-bold text-white mb-2">{card.val.toFixed(2)}€</p>
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${card.color} w-1/3 group-hover:w-full transition-all duration-1000 ease-out`}></div>
                      </div>
                  </div>
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-r ${card.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
              </div>
          ))}
      </div>

      {/* GRÁFICO DE RENDIMIENTO */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h3 className="text-2xl font-serif font-bold text-white">Análisis de Ingresos</h3>
            <p className="text-zinc-500 text-sm">Rendimiento financiero detallado por periodo</p>
          </div>
          <div className="flex bg-black/50 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
            {['weekly', 'monthly', 'yearly'].map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${view === v ? 'bg-amber-600 text-black shadow-lg shadow-amber-600/20' : 'text-zinc-500 hover:text-white'}`}>
                    {v === 'weekly' ? 'Semana' : v === 'monthly' ? 'Mes' : 'Año'}
                </button>
            ))}
          </div>
        </div>
        
        <div className="h-72 w-full relative px-2">
          {/* LÍNEAS DE FONDO */}
          <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
              {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-white"></div>)}
          </div>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible relative z-0">
            <defs>
              <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M0,100 ${points} 100,100`} fill="url(#chartGrad)" />
            <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          </svg>

          {/* PUNTOS DE DATOS (CON CSS PARA EVITAR DEFORMACIÓN) */}
          {stats.data.map((d, i) => (
              <div 
                key={i} 
                className="absolute w-3 h-3 bg-amber-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(245,158,11,0.8)] -translate-x-1/2 -translate-y-1/2 group/point cursor-pointer z-10 hover:scale-150 transition-transform"
                style={{ 
                    left: `${(i / (stats.data.length - 1)) * 100}%`, 
                    top: `${100 - (d.val / maxVal) * 80}%` 
                }}
              >
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                      {d.val.toFixed(2)}€
                  </div>
              </div>
          ))}
        </div>

        {/* EJE X */}
        <div className="flex justify-between mt-8 px-2">
             {stats.data.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{d.label}</span>
                </div>
             ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DETALLE PRODUCTO ---
const ProductDetailWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, toggleWishlist, wishlist } = useStore();
  const product = products.find(p => p.id === parseInt(id));

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!product) return <div className="text-white text-center mt-20">Cargando o producto no encontrado...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-10 animate-fade-in pb-20">
        <button onClick={() => navigate('/')} className="mb-6 text-zinc-400 hover:text-amber-500 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">← Volver al catálogo</button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl h-fit">
                <img src={product.image_url || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800"} alt={product.name} className="w-full h-full object-cover min-h-[400px]" />
            </div>
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-4xl font-serif font-bold text-white mb-2">{product.name}</h2>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">{product.category}</span>
                        <div className="flex text-amber-400">★★★★☆ <span className="text-zinc-500 ml-1">(4.8)</span></div>
                    </div>
                </div>
                <div className="text-4xl font-light text-white border-b border-zinc-800 pb-6">{product.price}€<span className="text-sm font-normal text-zinc-500 ml-2">IVA incluido</span></div>
                <p className="text-zinc-300 leading-relaxed text-lg">{product.description}</p>
                <div className="flex gap-4 mt-4">
                    <button onClick={() => { addToCart(product); toast.success(`Añadido: ${product.name}`); }} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl border transition ${product.stock > 0 ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:border-amber-500' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}>Añadir a la Cesta</button>
                    <button onClick={() => { addToCart(product); navigate('/checkout'); }} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl shadow-lg transition ${product.stock > 0 ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:opacity-90' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>Comprar Ahora</button>
                    <button onClick={() => { toggleWishlist(product); toast(wishlist.find(w=>w.id===product.id) ? "Eliminado de favoritos" : "Añadido a favoritos", { icon: '♥' }); }} className={`w-16 flex items-center justify-center rounded-xl border transition ${wishlist.find(w=>w.id===product.id) ? 'bg-amber-900/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}><span className="text-2xl">♥</span></button>
                </div>
            </div>
        </div>
        <ProductReviews productId={product.id} />
    </div>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, setUser, logout, 
    products, fetchProducts, recommendations, setRecommendations,
    cart, addToCart, removeFromCart, clearCart,
    wishlist, toggleWishlist,
    orders, setOrders, aiInsights, setAiInsights
  } = useStore();
  
  const [showAuth, setShowAuth] = useState(false); 
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Función para manejar Checkout con protección de sesión
  const handleProtectedCheckout = () => {
    if (!user) {
        toast("Debes iniciar sesión primero para comprar", {
            icon: '☕',
            duration: 4000,
            style: { background: '#18181b', color: '#f59e0b', border: '1px solid #f59e0b' }
        });
        setShowAuth(true);
        return;
    }
    navigate('/checkout');
  };
  
  // Estados para Checkout Desglosado
  const [shipping, setShipping] = useState({ 
    street: '', 
    number: '', 
    city: '', 
    state: '', 
    zip: '', 
    searchQuery: '' 
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef(null);

  const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '', holder: '' });
  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('new');
  
  const [stockEdits, setStockEdits] = useState({});
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: 'Café en Grano', image_url: '' });
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/admin/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) })
        });
        if (res.ok) {
            alert("Producto añadido");
            setNewProduct({ name: '', description: '', price: '', stock: '', category: 'Café en Grano', image_url: '' });
            fetchProducts();
        }
    } catch (e) { console.error(e); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            fetchProducts();
        }
    } catch (e) { console.error(e); }
  };

  const handleBulkUpdateStock = async () => {
    const updates = Object.keys(stockEdits).map(id => ({ id: parseInt(id), stock: stockEdits[id] }));
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/stock/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        alert("Stock actualizado");
        setStockEdits({});
        fetchProducts();
      }
    } catch (e) { console.error(e); }
  };

  const refreshAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    try {
        const [ordersRes, insightsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/orders`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
            fetch(`${API_BASE_URL}/admin/ai-insights`, { headers: { 'Authorization': `Bearer ${user.token}` } })
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (insightsRes.ok) setAiInsights(await insightsRes.json());
    } catch (e) { console.error(e); }
  };

  const handleMarkAsSent = async (orderId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/shipped`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            refreshAdminData();
        }
    } catch (e) { console.error(e); }
  };

  const handleSimulateActivity = async () => {
    const tId = toast.loading("Generando actividad de mercado...");
    try {
        const res = await fetch(`${API_BASE_URL}/admin/simulate-activity`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
            const data = await res.json();
            toast.success(data.message, { id: tId });
            refreshAdminData();
            fetchProducts();
        } else {
            toast.error("Error al simular actividad", { id: tId });
        }
    } catch (e) { toast.error("Error de conexión", { id: tId }); }
  };

  useEffect(() => {
    fetchProducts();
    if (user) {
        fetch(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${user.token}` } })
            .then(res => res.json())
            .then(data => setSavedCards(Array.isArray(data) ? data : []))
            .catch(e => console.log(e));
        
        if (user.role === 'admin') {
            refreshAdminData();
        }
    }
  }, [user, fetchProducts]);

  const handleCardChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setPayment({ ...payment, card: clean });
  };

  const handleExpiryChange = (val) => {
    let clean = val.replace(/\D/g, '').slice(0, 8);
    let formatted = "";
    if (clean.length > 0) {
        formatted += clean.slice(0, 2);
        if (clean.length >= 3) {
            formatted += '/' + clean.slice(2, 4);
            if (clean.length >= 5) {
                formatted += '/' + clean.slice(4, 8);
            }
        }
    }
    setPayment({ ...payment, expiry: formatted });
  };

  const handleCVVChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 3);
    setPayment({ ...payment, cvv: clean });
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        let urlRec = `${API_BASE_URL}/recommendations/`;
        if (user?.id) urlRec += `?user_id=${user.id}`;
        const resRec = await fetch(urlRec);
        const recData = resRec.ok ? await resRec.json() : [];
        setRecommendations(Array.isArray(recData) ? recData : []);
      } catch (err) { console.error(err); }
    };
    loadRecommendations();
  }, [user, setRecommendations, products]);

  // Autocompletado de dirección con Nominatim (OSM) - INSTANTÁNEO
  const handleAddressSearch = (query) => {
    setShipping({ ...shipping, searchQuery: query });
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length > 0) {
        searchTimeout.current = setTimeout(async () => {
            setIsSearchingAddress(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&countrycodes=es`);
                const data = await res.json();
                setAddressSuggestions(data);
            } catch (e) { console.log(e); }
            finally { setIsSearchingAddress(false); }
        }, 300); // 300ms de calma para no saturar, pero parece instantáneo
    } else {
        setAddressSuggestions([]);
    }
  };

  const selectAddress = (s) => {
    const addr = s.address;
    setShipping({
        ...shipping,
        street: addr.road || addr.pedestrian || addr.suburb || '',
        number: addr.house_number || '',
        city: addr.city || addr.town || addr.village || '',
        state: addr.province || addr.state || '',
        zip: addr.postcode || '',
        searchQuery: s.display_name
    });
    setAddressSuggestions([]);
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if(cart.length === 0) return;
    
    let cardInfo = null;
    if (selectedCardId === 'new') {
        cardInfo = {
            card_holder: payment.holder,
            last_four: payment.card.slice(-4),
            exp_month: payment.expiry.split('/')[0],
            exp_year: payment.expiry.split('/')[1] || '20',
            brand: payment.card.startsWith('4') ? 'visa' : 'mastercard',
            token: 'mock_token_' + Math.random().toString(36).substr(2, 9)
        };
    } else {
        const sc = savedCards.find(c => c.id === parseInt(selectedCardId));
        cardInfo = { ...sc, token: sc.token || 'saved_token' };
    }

    const fullAddress = `${shipping.street} ${shipping.number}, ${shipping.city}, ${shipping.state}, ${shipping.zip}`;

    const headers = { 'Content-Type': 'application/json' };
    if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                user: user?.email || "Invitado",
                items: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
                total: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
                address: fullAddress,
                save_card: saveCard,
                card_info: cardInfo
            })
        });
        if (response.ok) {
            toast.success("¡Pedido confirmado con éxito!");
            clearCart(); 
            navigate("/"); 
            fetchProducts(); // Refresca stock
            if (user.role === 'admin') {
                refreshAdminData(); // Refresca pedidos e insights en el panel
            }
        } else {
            const err = await response.json();
            toast.error(`Error: ${err.detail}`);
        }
    } catch (err) { toast.error("Error en el servidor de pagos"); }
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => category === "all" || p.category === category)
    .sort((a, b) => (b.stock > 0) - (a.stock > 0)); // ORDEN PROFESIONAL: Con stock arriba, sin stock abajo
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] font-sans selection:bg-[#d4af37] selection:text-black">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#080808', color: '#fff', border: '1px solid #d4af37' } }} />
      
      {/* BARRA DE NAVEGACIÓN ESTILO CADILLAC */}
      <nav className="fixed w-full top-0 z-50 bg-[#050505]/95 backdrop-blur-3xl border-b border-[#d4af37]/10">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex items-center justify-between h-28 relative">
            <div className="flex items-center gap-10">
               <LanguageSelector />
               {user && user.role === 'admin' && (
                 <Link to="/admin" className="hidden lg:block text-[9px] font-black uppercase tracking-[0.4em] text-[#d4af37] hover:text-white transition-colors">Administración</Link>
               )}
            </div>
            
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group" onClick={() => setSearch("")}>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#d4af37] group-hover:text-[#d4af37] transition-all duration-500 uppercase">EL GRANO DE ORO</h1>
              <span className="text-[7px] uppercase tracking-[0.8em] text-white font-black -mt-1">TOSTADORES DESDE 1920</span>
            </Link>

            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                   <Link to="/wishlist" className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-[#d4af37] transition-all">
                     <span className="text-2xl font-light">♥</span>
                   </Link>
                   <Link to="/cart" className="relative w-12 h-12 flex items-center justify-center text-white hover:text-[#d4af37] transition-all">
                     <span className="text-2xl font-light">🛒</span>
                     {cart.length > 0 && <span className="absolute top-2 right-2 bg-[#d4af37] text-black text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cart.reduce((a,c)=>a+c.qty,0)}</span>}
                   </Link>
               </div>
               {user ? (
                 <button onClick={logout} className="text-[9px] font-black text-[#d4af37] hover:text-white ml-4 uppercase tracking-[0.3em]">Cerrar Sesión</button>
               ) : (
                 <button onClick={() => setShowAuth(true)} className="ml-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#d4af37] border border-[#d4af37]/30 px-8 py-2.5 rounded-full hover:bg-[#d4af37] hover:text-black transition-all">Iniciar Sesión</button>
               )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12">
        <Routes>
          <Route path="/" element={
             <>
               {search.length > 0 ? (
                   <div className="max-w-7xl mx-auto px-4 mt-8 min-h-screen">
                       <div className="flex flex-col md:flex-row gap-4 mb-8 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-800/50 shadow-2xl items-center group">
                           <div className="relative flex-1 w-full">
                               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                   </svg>
                               </div>
                               <input 
                                   className="premium-input w-full pl-24 pr-12 text-lg placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/20" 
                                   placeholder="Busca tu café ideal..." 
                                   value={search} 
                                   onChange={e=>setSearch(e.target.value)} 
                                   autoFocus
                               />
                               {search && (
                                   <button onClick={() => setSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                       </svg>
                                   </button>
                               )}
                           </div>
                           <select className="premium-input bg-zinc-950/50 border-zinc-800 text-sm font-bold uppercase tracking-widest cursor-pointer" onChange={e=>setCategory(e.target.value)}>
                               <option value="all">Todo el Grano</option>
                               <option value="Café en Grano">Grano</option>
                               <option value="Café Molido">Molido</option>
                               <option value="Accesorios">Accesorios</option>
                           </select>
                       </div>
                       <h2 className="text-2xl font-serif text-white mb-6">Resultados para "{search}"</h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                           {filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={() => { addToCart(p); navigate('/checkout'); }} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} />)}
                       </div>
                   </div>
               ) : (
                   <>
                       <div className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden mb-16">
                           <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600" alt="Hero" className="absolute inset-0 w-full h-full object-cover grayscale brightness-50" />
                           <div className="relative z-10 text-center px-4">
                               <h2 className="text-5xl md:text-8xl font-serif font-black mb-6 bg-gradient-to-b text-[#d4af37] bg-clip-text text-transparent">EL GRANO DE ORO</h2>
                               <p className="text-white text-lg md:text-2xl font-light tracking-[0.5em] uppercase">Especialistas en Café</p>
                           </div>
                       </div>
                       <div className="max-w-7xl mx-auto px-4">
                           <div className="flex flex-col md:flex-row gap-4 mb-12 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-800/50 shadow-2xl items-center group">
                               <div className="relative flex-1 w-full">
                                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                       </svg>
                                   </div>
                                   <input 
                                       className="premium-input w-full pl-24 pr-12 text-lg placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/20" 
                                       placeholder="Busca tu café ideal..." 
                                       value={search} 
                                       onChange={e=>setSearch(e.target.value)} 
                                   />
                                   {search && (
                                       <button 
                                           onClick={() => setSearch("")}
                                           className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                                       >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                           </svg>
                                       </button>
                                   )}
                               </div>
                               <div className="flex gap-2 w-full md:w-auto">
                                   <select 
                                       className="premium-input bg-zinc-950/50 border-zinc-800 text-sm font-bold uppercase tracking-widest cursor-pointer hover:border-zinc-600"
                                       onChange={e=>setCategory(e.target.value)}
                                   >
                                       <option value="all">Todo el Grano</option>
                                       <option value="Café en Grano">Grano</option>
                                       <option value="Café Molido">Molido</option>
                                       <option value="Accesorios">Accesorios</option>
                                   </select>
                               </div>
                           </div>
                           {recommendations.length > 0 && category === 'all' && (
                               <section className="mb-16">
                                   <h2 className="text-2xl font-serif text-[#d4af37] mb-6 flex items-center gap-4 italic">{user ? "Para ti" : "Destacados"}<div className="h-px bg-amber-900/30 flex-1"></div></h2>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                       {recommendations.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={() => { addToCart(p); navigate('/checkout'); }} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} isRecommended={true} />)}
                                   </div>
                               </section>
                           )}
                           <section><h2 className="text-2xl font-serif text-[#d4af37] mb-6 flex items-center gap-4 italic">Catálogo <div className="h-px bg-zinc-800 flex-1"></div></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={() => { addToCart(p); navigate('/checkout'); }} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} />)}</div></section>
                       </div>
                   </>
               )}
             </>
          } />
          <Route path="/product/:id" element={<ProductDetailWrapper />} />
          <Route path="/cart" element={
              <div className="max-w-4xl mx-auto px-4 mt-10">
                 <h2 className="text-3xl font-serif text-[#d4af37] mb-8">Tu Selección</h2>
                 {cart.length === 0 ? <p className="text-zinc-500 text-center">Tu cesta está vacía.</p> : (
                    <div className="space-y-4">
                        {cart.map(i => (
                            <div key={i.id} className="flex flex-col md:flex-row justify-between bg-zinc-900 p-6 rounded-xl border border-zinc-800 items-center gap-4">
                                <div className="flex gap-4 items-center w-full md:w-auto">
                                   <img src={i.image_url} className="w-16 h-16 object-cover rounded" />
                                   <div><h4 className="font-bold text-white">{i.name}</h4><p className="text-amber-500">{i.price}€</p></div>
                                </div>
                                <div className="flex gap-4 items-center">
                                   <div className="flex gap-2 bg-zinc-950 rounded-lg p-1 border border-zinc-800"><button onClick={()=>removeFromCart(i)} className="px-2">-</button><span className="px-2">{i.qty}</span><button onClick={()=>addToCart(i)} className="px-2">+</button></div>
                                   <span className="font-bold text-white">{(i.price * i.qty).toFixed(2)}€</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-col items-end mt-8 border-t border-zinc-800 pt-8">
                            <p className="text-4xl font-serif text-amber-500 font-bold mb-6">{cartTotal.toFixed(2)}€</p>
                            <button onClick={handleProtectedCheckout} className="bg-amber-600 text-black px-12 py-3 rounded-xl font-bold hover:bg-amber-500 transition">Checkout</button>
                        </div>
                    </div>
                 )}
              </div>
          } />
          <Route path="/wishlist" element={
              <div className="max-w-4xl mx-auto px-4 mt-10">
                 <h2 className="text-3xl font-serif text-amber-500 mb-8">Favoritos</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map(i => (
                        <div key={i.id} className="flex gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 items-center">
                            <img src={i.image_url} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{i.name}</h4>
                                <p className="text-amber-500 text-sm">{i.price}€</p>
                            </div>
                            <button onClick={()=>{addToCart(i); toggleWishlist(i)}} className="bg-amber-600/10 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-600 hover:text-black">Mover</button>
                        </div>
                    ))}
                    {wishlist.length === 0 && <p className="text-zinc-500 text-center col-span-2">Vacío.</p>}
                 </div>
              </div>
          } />
          <Route path="/checkout" element={
             <div className="max-w-7xl mx-auto px-4 mt-10 pb-20">
               <h2 className="text-3xl font-serif font-bold text-amber-500 mb-8 text-center italic">Finalizar Pedido</h2>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   {/* SECCIÓN IZQUIERDA: DATOS */}
                   <div className="lg:col-span-2 space-y-8">
                       {/* ENVÍO DESGLOSADO */}
                       <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🚚 Dirección de Envío</h3>
                           
                           {/* Buscador Predictivo Instantáneo */}
                           <div className="relative mb-6">
                               <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Buscador Inteligente</p>
                               <input 
                                    className="premium-input w-full" 
                                    placeholder="Empieza a escribir tu dirección..." 
                                    value={shipping.searchQuery}
                                    onChange={(e) => handleAddressSearch(e.target.value)}
                               />
                               {isSearchingAddress && <div className="absolute right-4 top-10 text-amber-500 animate-spin text-xl">⏳</div>}
                               {addressSuggestions.length > 0 && (
                                   <div className="absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-xl mt-1 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                       {addressSuggestions.map((s, idx) => (
                                           <button 
                                                key={idx} 
                                                type="button"
                                                onClick={() => selectAddress(s)}
                                                className="w-full text-left px-4 py-3 hover:bg-amber-600 hover:text-black transition text-xs border-b border-zinc-700 last:border-0"
                                           >
                                               {s.display_name}
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>

                           {/* Campos Desglosados */}
                           <div className="grid grid-cols-4 gap-4 animate-fade-in">
                               <div className="col-span-3">
                                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Calle / Vía</p>
                                   <input className="premium-input w-full" value={shipping.street} onChange={e=>setShipping({...shipping, street: e.target.value})} required />
                               </div>
                               <div className="col-span-1">
                                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Nº</p>
                                   <input className="premium-input w-full" value={shipping.number} onChange={e=>setShipping({...shipping, number: e.target.value})} required />
                               </div>
                               <div className="col-span-2">
                                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Ciudad</p>
                                   <input className="premium-input w-full" value={shipping.city} onChange={e=>setShipping({...shipping, city: e.target.value})} required />
                               </div>
                               <div className="col-span-1">
                                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">C.P.</p>
                                   <input className="premium-input w-full" value={shipping.zip} onChange={e=>setShipping({...shipping, zip: e.target.value})} required />
                               </div>
                               <div className="col-span-1">
                                   <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Provincia</p>
                                   <input className="premium-input w-full" value={shipping.state} onChange={e=>setShipping({...shipping, state: e.target.value})} required />
                               </div>
                           </div>
                       </div>

                       {/* PAGO */}
                       <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl">
                           <h3 className="text-xl font-bold text-white mb-6">💳 Método de Pago</h3>
                           {savedCards.length > 0 && (
                               <div className="mb-6 space-y-3">
                                   <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-2">Tarjetas Guardadas</p>
                                   {savedCards.map(c => (
                                       <label key={c.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${selectedCardId === c.id ? 'bg-amber-600/10 border-amber-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                                           <div className="flex items-center gap-4">
                                               <input type="radio" name="card" checked={selectedCardId === c.id} onChange={() => setSelectedCardId(c.id)} className="text-amber-500 focus:ring-amber-500 bg-zinc-900" />
                                               <div>
                                                   <p className="text-white font-bold uppercase text-sm">{c.brand} **** {c.last_four}</p>
                                                   <p className="text-zinc-500 text-xs">{c.card_holder} | Exp: {c.exp_month}/{c.exp_year}</p>
                                               </div>
                                           </div>
                                           <span className="text-zinc-700">🔒</span>
                                       </label>
                                   ))}
                                   <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${selectedCardId === 'new' ? 'bg-amber-600/10 border-amber-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                                       <input type="radio" name="card" checked={selectedCardId === 'new'} onChange={() => setSelectedCardId('new')} className="text-amber-500 focus:ring-amber-500 bg-zinc-900" />
                                       <span className="text-white font-bold text-sm">Usar otra tarjeta</span>
                                   </label>
                               </div>
                           )}
                           {selectedCardId === 'new' && (
                               <div className="space-y-4 animate-fade-in">
                                   <input className="premium-input w-full" placeholder="Nombre en la tarjeta" value={payment.holder} onChange={e => setPayment({...payment, holder: e.target.value})} required={selectedCardId === 'new'} />
                                   <input className="premium-input w-full" placeholder="Número de tarjeta (16 dígitos)" value={payment.card} onChange={e => handleCardChange(e.target.value)} required={selectedCardId === 'new'} />
                                   <div className="flex gap-4">
                                       <input className="premium-input w-1/2" placeholder="DD/MM/AAAA" value={payment.expiry} onChange={e => handleExpiryChange(e.target.value)} required={selectedCardId === 'new'} />
                                       <input className="premium-input w-1/2" placeholder="CVV" value={payment.cvv} onChange={e => handleCVVChange(e.target.value)} required={selectedCardId === 'new'} />
                                   </div>
                                   <label className="flex items-center gap-3 cursor-pointer group mt-4">
                                       <input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500" />
                                       <span className="text-zinc-400 text-sm group-hover:text-white transition">Guardar esta tarjeta para mis próximas compras</span>
                                   </label>
                               </div>
                           )}
                       </div>
                   </div>

                   {/* SECCIÓN DERECHA: RESUMEN */}
                   <div className="space-y-6">
                       <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl sticky top-24">
                           <h3 className="text-xl font-bold text-white mb-6">Resumen del Pedido</h3>
                           <div className="space-y-4 mb-6">
                               {cart.map(i => (
                                   <div key={i.id} className="flex justify-between text-sm">
                                       <span className="text-zinc-400">{i.qty}x {i.name}</span>
                                       <span className="text-white">{(i.price * i.qty).toFixed(2)}€</span>
                                   </div>
                               ))}
                           </div>
                           <div className="border-t border-zinc-800 pt-6 mb-8">
                               <div className="flex justify-between items-end">
                                   <span className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Total a Pagar</span>
                                   <span className="text-3xl font-serif text-amber-500 font-bold">{cartTotal.toFixed(2)}€</span>
                               </div>
                           </div>
                           <button onClick={processPayment} className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-900/20 uppercase tracking-widest">Confirmar y Pagar</button>
                           <p className="text-[10px] text-zinc-600 text-center mt-4">Pago seguro cifrado SSL de 256 bits</p>
                       </div>
                   </div>
               </div>
             </div>
          } />
          <Route path="/admin" element={
            <div className="max-w-7xl mx-auto px-4 mt-10 pb-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-4 gap-4">
                  <h2 className="text-3xl font-serif font-bold text-white">Admin Dashboard</h2>
                  <button 
                    onClick={handleSimulateActivity}
                    className="bg-zinc-100 text-black px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <span>🚀</span> Simular Actividad del Mercado
                  </button>
              </div>
              {aiInsights && (
                <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30 mb-8 grid grid-cols-3 gap-4">
                    <div><p className="text-indigo-300 text-xs font-bold">HORA PICO</p><p className="text-2xl">{aiInsights.hora_pico_ventas}:00</p></div>
                    <div><p className="text-purple-300 text-xs font-bold">CONVERSIÓN</p><p className="text-2xl">{aiInsights.tasa_conversion}%</p></div>
                    <div><p className="text-emerald-300 text-xs font-bold">IA TIP</p><p className="text-xs italic">"{aiInsights.consejo_ia}"</p></div>
                </div>
              )}
              <div className="mb-8"><SalesChart orders={orders} /></div>

              {/* SECCIÓN: PEDIDOS PENDIENTES */}
              <div className="mb-12">
                  <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-amber-500 text-black rounded-full text-sm">!</span>
                    Pedidos por Completar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {orders.filter(o => o.status === 'pending').map(o => (
                          <div key={o.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 hover:border-amber-500/50 transition-all shadow-xl group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                                      <span className="text-amber-500 font-black text-xs">ORDEN #{o.id}</span>
                                  </div>
                                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-tighter">{new Date(o.date).toLocaleString()}</span>
                              </div>
                              <div className="space-y-1 mb-4">
                                  <p className="text-white font-bold">{o.user}</p>
                                  <p className="text-zinc-400 text-xs italic line-clamp-2">{o.items}</p>
                                  <p className="text-zinc-600 text-[10px] uppercase tracking-widest leading-tight mt-2">{o.address}</p>
                              </div>
                              <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
                                  <span className="text-2xl font-serif font-bold text-white">{o.total.toFixed(2)}€</span>
                                  <button onClick={() => handleMarkAsSent(o.id)} className="bg-amber-600 text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/20 group-hover:scale-105 active:scale-95">Marcar como enviado</button>
                              </div>
                          </div>
                      ))}
                      {orders.filter(o => o.status === 'pending').length === 0 && (
                        <div className="col-span-2 py-12 text-center bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-800">
                            <p className="text-zinc-600 font-bold italic">No hay pedidos pendientes de envío. ✨</p>
                        </div>
                      )}
                  </div>
              </div>

              {/* SECCIÓN: PEDIDOS COMPLETADOS */}
              <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-serif font-bold flex items-center gap-3 text-zinc-500">
                        <span className="flex items-center justify-center w-8 h-8 bg-zinc-800 text-zinc-500 rounded-full text-sm">✓</span>
                        Historial de Pedidos Completados
                      </h3>
                      {orders.filter(o => o.status === 'shipped').length > 10 && (
                          <button 
                            onClick={() => setShowAllCompleted(!showAllCompleted)}
                            className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                          >
                            {showAllCompleted ? "Ver menos" : `Ver los ${orders.filter(o => o.status === 'shipped').length} pedidos`}
                          </button>
                      )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                      {orders
                        .filter(o => o.status === 'shipped')
                        .slice(0, showAllCompleted ? undefined : 10)
                        .map(o => (
                          <div key={o.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-900 flex justify-between items-center group animate-fade-in">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-zinc-600 font-bold text-[10px]">#{o.id}</span>
                                      <span className="text-emerald-500 text-[8px] font-black border border-emerald-500/30 px-1.5 rounded uppercase">Enviado</span>
                                  </div>
                                  <p className="text-zinc-300 text-xs font-bold truncate w-40">{o.user}</p>
                                  <p className="text-zinc-600 text-[10px]">{new Date(o.date).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-white font-bold text-sm">{o.total.toFixed(2)}€</p>
                                  <p className="text-zinc-700 text-[8px] italic">Completado</p>
                              </div>
                          </div>
                      ))}
                      {orders.filter(o => o.status === 'shipped').length === 0 && <p className="text-zinc-800 text-sm italic col-span-3">Aún no se ha completado ningún pedido.</p>}
                  </div>
                  
                  {!showAllCompleted && orders.filter(o => o.status === 'shipped').length > 10 && (
                      <button 
                        onClick={() => setShowAllCompleted(true)}
                        className="w-full mt-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all border-dashed"
                      >
                        + Mostrar historial completo
                      </button>
                  )}
              </div>

              <div className="flex justify-between items-end mb-4">
                  <h3 className="text-2xl font-bold">📦 Inventario</h3>
                  {Object.keys(stockEdits).length > 0 && <button onClick={handleBulkUpdateStock} className="bg-amber-600 text-black px-6 py-2 rounded-lg font-bold">Guardar Cambios</button>}
              </div>

              {/* FORMULARIO: NUEVO PRODUCTO */}
              <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 mb-8">
                  <h4 className="text-lg font-bold mb-6 text-amber-500">➕ Añadir Nuevo Producto</h4>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <input className="premium-input w-full" placeholder="Nombre" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} required />
                      <input className="premium-input w-full" placeholder="Precio (€)" type="number" step="0.01" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} required />
                      <input className="premium-input w-full" placeholder="Stock inicial" type="number" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock: e.target.value})} required />
                      <div className="md:col-span-2">
                          <input className="premium-input w-full" placeholder="Descripción corta" value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} required />
                      </div>
                      <select className="premium-input w-full" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})}>
                          <option value="Café en Grano">Café en Grano</option>
                          <option value="Café Molido">Café Molido</option>
                          <option value="Accesorios">Accesorios</option>
                      </select>
                      <div className="md:col-span-2">
                          <input className="premium-input w-full" placeholder="URL de la imagen" value={newProduct.image_url} onChange={e=>setNewProduct({...newProduct, image_url: e.target.value})} required />
                      </div>
                      <button type="submit" className="bg-amber-600 text-black font-bold py-3 rounded-xl hover:bg-amber-500 transition shadow-lg">Crear Producto</button>
                  </form>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-950 font-bold border-b border-zinc-800">
                    <tr><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-zinc-800/50">
                        <td className="p-4 text-white font-bold">{p.name}</td>
                        <td className="p-4">{p.price}€</td>
                        <td className="p-4">
                           <input type="number" value={stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock} onChange={(e) => setStockEdits({...stockEdits, [p.id]: parseInt(e.target.value)})} className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-20" />
                        </td>
                        <td className="p-4">
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-400 font-bold">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          } />
        </Routes>
      </main>

      <style>{`
        .premium-input { 
          background: #080808; 
          border: 1px solid rgba(212, 175, 55, 0.1); 
          color: #ffffff; 
          padding: 0 4rem; 
          height: 4.5rem;
          display: flex;
          align-items: center;
          border-radius: 1.25rem; 
          outline: none; 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          line-height: 1.6;
          box-sizing: border-box;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        } 
        .premium-input:focus { 
          border-color: #d4af37; 
          background: #0a0a0a;
          box-shadow: 0 0 0 1px #d4af37, 0 10px 30px rgba(0,0,0,0.3);
        }
        select.premium-input {
          padding: 0 2.5rem;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d4af37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.5rem center;
          background-size: 1.2rem;
          padding-right: 4.5rem;
        }
        textarea.premium-input {
          padding: 1.5rem 4rem;
          min-height: 150px;
          height: auto;
        }
        .premium-input::placeholder {
          color: rgba(255, 255, 255, 0.1);
          font-weight: 300;
        }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); } 
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* LIMPIEZA GOOGLE TRANSLATE */
        .goog-te-banner-frame.skiptranslate, .goog-te-gadget-icon { display: none !important; }
        body { top: 0px !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
        #google_translate_element { display: none !important; }
        .skiptranslate { display: none !important; }
      `}</style>
      <ChatAssistant />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); setShowAuth(false); }} />}
    </div>
  );
}

// --- MODAL DE AUTH ---
function AuthModal({ onClose, onLogin }) {
    const [isReg, setIsReg] = useState(false); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
    const submit = async (e) => {
        e.preventDefault();
        try {
            if(isReg) {
                const res = await fetch(`${API_BASE_URL}/users/`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) });
                if(!res.ok) throw new Error("Error registrando usuario");
                toast.success("Cuenta creada correctamente");
                setIsReg(false);
            } else {
                const form = new URLSearchParams(); form.append('username', email); form.append('password', password);
                const res = await fetch(`${API_BASE_URL}/token`, { method: 'POST', body: form });
                if(!res.ok) throw new Error("Email o contraseña incorrectos");
                const data = await res.json();
                onLogin({ email, id: data.user_id, role: data.role, token: data.access_token });
                toast.success(`Bienvenido de nuevo`);
            }
        } catch(err) { toast.error(err.message); }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-700 w-full max-w-md relative shadow-2xl">
                <h2 className="text-3xl font-serif text-amber-500 mb-6 text-center font-bold italic">{isReg?"Registro":"Acceso"}</h2>
                <form onSubmit={submit} className="space-y-4">
                    <input className="premium-input w-full" type="email" placeholder="Email" onChange={e=>setEmail(e.target.value)} required />
                    <input className="premium-input w-full" type="password" placeholder="Contraseña" onChange={e=>setPassword(e.target.value)} required />
                    <button className="w-full bg-amber-600 text-black font-bold py-4 rounded-xl mt-4 hover:bg-amber-500 transition shadow-lg">{isReg?"Registrar":"Entrar"}</button>
                </form>
                <div className="mt-6 text-center text-zinc-500 text-sm cursor-pointer hover:text-white transition" onClick={()=>setIsReg(!isReg)}>{isReg?"¿Ya tienes cuenta? Entra":"¿No tienes cuenta? Regístrate"}</div>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
            </div>
        </div>
    )
}

export default App;