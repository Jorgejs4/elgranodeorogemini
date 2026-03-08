import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';

// --- CONFIGURACIÓN DE URL ---
const API_BASE_URL = 'https://grano-oro-api.onrender.com';

// 1. FUNCIÓN FUERA (Sin cambios, para evitar errores de inmutabilidad)
const setLanguageCookie = (langCode) => {
  const domain = window.location.hostname;
  if (langCode === 'es') {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
  } else {
    document.cookie = `googtrans=/es/${langCode}; path=/;`;
    document.cookie = `googtrans=/es/${langCode}; path=/; domain=.${domain}`;
  }
  window.location.reload(); 
};

// 2. COMPONENTE SELECTOR DE IDIOMAS
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

  const [currentLangCode] = useState(() => {
    const name = 'googtrans';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieVal = decodeURIComponent(parts.pop().split(';').shift());
      return cookieVal.split('/').pop() || 'es';
    }
    return 'es';
  });

  const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

  return (
    <div className="relative mr-2 md:mr-4 flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 hover:border-amber-500 transition-all shadow-lg overflow-hidden"
      >
        <img src={currentLang.flag} alt={currentLang.name} className="w-6 h-6 object-cover rounded-full" />
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-2 w-40 z-50 animate-fade-in">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setIsOpen(false);
                setLanguageCookie(lang.code);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-zinc-800 transition flex items-center gap-3 ${currentLangCode === lang.code ? 'text-amber-500 font-bold bg-zinc-800/50' : 'text-zinc-300'}`}
            >
              <img src={lang.flag} alt={lang.name} className="w-5 h-5 object-cover rounded-full" />
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
      
      <div id="google_translate_element" className="hidden"></div>
      
      <style>{`
        .goog-te-banner-frame.skiptranslate, .skiptranslate > iframe, .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
        body { top: 0px !important; position: static !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        font { background: transparent !important; }
      `}</style>
    </div>
  );
};

// --- COMPONENTE DE GRÁFICO MEJORADO ---
const SalesChart = ({ orders }) => {
  const [view, setView] = useState('weekly');

  const data = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const today = new Date();
    let result = [];

    if (view === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const total = orders.filter(o => o.date && new Date(o.date).toDateString() === d.toDateString()).reduce((a, c) => a + (c.total || 0), 0);
        result.push({ day: d.toLocaleDateString('es-ES', { weekday: 'short' }), val: total });
      }
    } else if (view === 'monthly') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today); d.setDate(today.getDate() - (i * 7));
        const total = orders.filter(o => o.date && new Date(o.date) >= new Date(d.setHours(0,0,0,0) - (7*86400000)) && new Date(o.date) <= new Date(d.setHours(23,59,59,999))).reduce((a, c) => a + (c.total || 0), 0);
        result.push({ day: `Sem -${i}`, val: total });
      }
    } else if (view === 'yearly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const total = orders.filter(o => o.date && new Date(o.date).getMonth() === d.getMonth() && new Date(o.date).getFullYear() === d.getFullYear()).reduce((a, c) => a + (c.total || 0), 0);
        result.push({ day: d.toLocaleDateString('es-ES', { month: 'short' }), val: total });
      }
    }
    return result;
  }, [orders, view]);

  if (!Array.isArray(orders) || orders.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.val), 10); // Evitar dividir por 0
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.val / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-72 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4 z-20">
        <h3 className="text-zinc-400 text-xs uppercase tracking-widest">Rendimiento en Ventas</h3>
        <select value={view} onChange={(e) => setView(e.target.value)} className="bg-zinc-950 text-white border border-zinc-700 rounded-lg px-3 py-1 text-xs outline-none focus:border-amber-500">
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
      </div>
      <div className="absolute inset-0 top-16 px-6 pb-6">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M0,100 ${points} 100,100`} fill="url(#gradient)" />
          <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-between mt-3 text-[10px] md:text-xs text-zinc-500 font-mono">
           {data.map((d, i) => <span key={i} className="uppercase">{d.day}</span>)}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE WRAPPER PARA DETALLE DE PRODUCTO ---
const ProductDetailWrapper = ({ products, addToCart, buyNow, toggleWishlist, wishlist }) => {
  const { id } = useParams();
  const navigate = useNavigate();
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
                    <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl border transition ${product.stock > 0 ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:border-amber-500' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}>Añadir a la Cesta</button>
                    <button onClick={() => buyNow(product)} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl shadow-lg transition ${product.stock > 0 ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:opacity-90' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>Comprar Ahora</button>
                    <button onClick={() => toggleWishlist(product)} className={`w-16 flex items-center justify-center rounded-xl border transition ${wishlist.find(w=>w.id===product.id) ? 'bg-amber-900/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}><span className="text-2xl">♥</span></button>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [orders, setOrders] = useState([]);
  
  const [showAuth, setShowAuth] = useState(false); 
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [aiInsights, setAiInsights] = useState(null);

  const [shipping, setShipping] = useState({ address: '', city: '', country: '', zip: '' });
  const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '', holder: '' });
  const [savedCards] = useState([{ id: 1, last4: '4242', brand: 'Visa' }]);
  const [useNewCard, setUseNewCard] = useState(false);

  // NUEVOS ESTADOS PARA GESTIÓN MASIVA DE STOCK
  const [stockEdits, setStockEdits] = useState({});

  // Tracking de vistas
  useEffect(() => {
    if (location.pathname.startsWith('/product/')) {
       const prodId = location.pathname.split('/')[2];
       if(prodId && !isNaN(prodId)) {
          fetch(`${API_BASE_URL}/track`, {
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ product_id: parseInt(prodId), action_type: 'view' })
          }).catch(err => console.log("Tracking error:", err));
       }
    }
  }, [location]);

  // Cargar productos y recomendaciones
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/?skip=0&limit=100`);
        const data = await res.json();
        let urlRec = `${API_BASE_URL}/recommendations/`;
        if (user?.id) urlRec += `?user_id=${user.id}`;
        const resRec = await fetch(urlRec);
        const recData = resRec.ok ? await resRec.json() : [];
        if (isMounted) { 
          setProducts(Array.isArray(data) ? data : []); 
          setRecommendations(Array.isArray(recData) ? recData : []); 
        }
      } catch (err) { console.error(err); }
    };
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  // Cargar datos del panel Admin
  useEffect(() => {
    if (user && user.role === 'admin' && location.pathname === '/admin') {
      const fetchOrders = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/orders`, { headers: { 'Authorization': `Bearer ${user.token}` } });
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
          
          const resAi = await fetch(`${API_BASE_URL}/admin/ai-insights`, { headers: { 'Authorization': `Bearer ${user.token}` } });
          const dataAi = await resAi.json();
          setAiInsights(dataAi);
        } catch (err) { console.error(err); setOrders([]); }
      };
      fetchOrders();
    }
  }, [user, location.pathname]);

  const addToCart = (product) => {
    const exist = cart.find(x => x.id === product.id);
    if (exist) setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
    else setCart([...cart, { ...product, qty: 1 }]);
    fetch(`${API_BASE_URL}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.id, action_type: 'add_to_cart' })}).catch(e=>console.log(e));
  };

  const removeFromCart = (product) => {
    const exist = cart.find(x => x.id === product.id);
    if (!exist) return;
    if (exist.qty === 1) setCart(cart.filter(x => x.id !== product.id));
    else setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty - 1 } : x));
  };

  const toggleWishlist = (product) => {
      if (wishlist.find(x => x.id === product.id)) setWishlist(wishlist.filter(x => x.id !== product.id));
      else setWishlist([...wishlist, product]);
  };

  const buyNow = (product) => { 
    setCart([{ ...product, qty: 1 }]); 
    if (!user) { setShowAuth(true); } else { navigate("/checkout"); }
  };

  const handleCreateProduct = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newProd = Object.fromEntries(formData.entries());
      newProd.price = parseFloat(newProd.price);
      newProd.stock = parseInt(newProd.stock); 
      try {
        const res = await fetch(`${API_BASE_URL}/products/`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newProd) });
        if(res.ok) {
            const saved = await res.json();
            setProducts(prev => [...prev, saved]);
            e.target.reset(); alert("Producto creado");
        }
      } catch (err) { console.error(err); }
  };
  
  const handleDeleteProduct = async (id) => {
      if(window.confirm("¿Estás seguro de que quieres eliminar este producto? Se borrará para siempre.")) {
          try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
          } catch (error) { console.error(error); }
      }
  };

  const handleShipOrder = async (orderId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/ship`, { method: 'PUT', headers: { 'Authorization': `Bearer ${user.token}` } });
        if (res.ok) {
            setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'shipped'} : o));
            alert("📦 Pedido marcado como enviado");
        }
    } catch (error) { console.error(error); }
  };

  // --- NUEVAS FUNCIONES DE STOCK MASIVO E IA ---
  const handleStockChange = (id, val) => {
      setStockEdits(prev => ({ ...prev, [id]: parseInt(val) || 0 }));
  };

  const handleBulkUpdateStock = async () => {
      const updates = Object.keys(stockEdits).map(id => ({ id: parseInt(id), stock: stockEdits[id] }));
      if (updates.length === 0) return alert("No hay cambios que guardar.");
      
      try {
          const res = await fetch(`${API_BASE_URL}/admin/products/stock/bulk`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
              body: JSON.stringify({ updates })
          });
          if(res.ok) {
              alert("✅ Todo el stock se ha actualizado de golpe.");
              setStockEdits({}); 
              const resProd = await fetch(`${API_BASE_URL}/products/`);
              setProducts(await resProd.json());
          }
      } catch(err) { console.error(err); }
  };

  const handleSeedAIData = async () => {
      if(!window.confirm("¿Inyectar 50 pedidos y 200 interacciones para entrenar la IA?")) return;
      try {
          const res = await fetch(`${API_BASE_URL}/admin/seed-ai-data`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if(res.ok) {
              alert("🧠 Datos de IA inyectados. Recarga la página para ver las estadísticas.");
              window.location.reload();
          }
      } catch(err) { console.error(err); }
  };

  // --- PROCESAR PAGO CORREGIDO ---
  const processPayment = async (e) => {
    e.preventDefault();
    if(cart.length === 0) return;
    
    cart.forEach(item => { fetch(`${API_BASE_URL}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: item.id, action_type: 'purchase' })}).catch(e=>console.log(e)); });

    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({
                user: user.email,
                items: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
                total: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
                address: `${shipping.address}, ${shipping.city}, ${shipping.zip}`
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Error interno del servidor (500)");
        }
        
        await response.json(); 
        alert(`🎉 ¡Pedido confirmado y stock actualizado!`);
        setCart([]); navigate("/"); window.scrollTo(0,0);
        
        const resProd = await fetch(`${API_BASE_URL}/products/`);
        const updatedProds = await resProd.json();
        setProducts(updatedProds);

    } catch (err) { 
        console.error("Error real:", err); 
        alert(`Fallo en la compra: ${err.message}`); 
    }
  };

  // Cálculos de ventas para el panel
  const today = new Date();
  const salesToday = orders.filter(o => o.date && new Date(o.date).toDateString() === today.toDateString()).reduce((acc, curr) => acc + (curr.total || 0), 0);
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const salesWeek = orders.filter(o => o.date && new Date(o.date) >= startOfWeek).reduce((acc, curr) => acc + (curr.total || 0), 0);
  const salesMonth = orders.filter(o => o.date && new Date(o.date).getMonth() === today.getMonth() && new Date(o.date).getFullYear() === today.getFullYear()).reduce((acc, curr) => acc + (curr.total || 0), 0);
  const salesYear = orders.filter(o => o.date && new Date(o.date).getFullYear() === today.getFullYear()).reduce((acc, curr) => acc + (curr.total || 0), 0);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).filter(p => category === "all" || p.category === category);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSearch("")}>
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">El Grano de Oro</h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
               
               <LanguageSelector />

               {user && user.role === 'admin' && (
                 <Link to="/admin" className="hidden md:block px-4 py-2 text-sm font-bold text-amber-500 border border-amber-500/50 rounded-full hover:bg-amber-500 hover:text-black transition-all">⚙️ Panel Admin</Link>
               )}
               <Link to="/wishlist" className="relative cursor-pointer group p-2">
                 <span className={`text-2xl transition ${wishlist.length > 0 ? 'text-amber-500' : 'text-zinc-300 group-hover:text-amber-400'}`}>♥</span>
                 {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-zinc-100 text-black text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlist.length}</span>}
               </Link>
               <Link to="/cart" className="relative cursor-pointer group p-2">
                 <span className="text-2xl text-zinc-300 group-hover:text-amber-400 transition">🛒</span>
                 {cart.length > 0 && <span className="absolute top-0 right-0 bg-amber-600 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{cart.reduce((a,c)=>a+c.qty,0)}</span>}
               </Link>
               {user ? (
                 <button onClick={() => { setUser(null); localStorage.removeItem('user'); navigate("/"); }} className="text-xs font-bold text-zinc-400 hover:text-amber-500 ml-2 md:ml-4 uppercase tracking-wider transition border-l border-zinc-700 pl-2 md:pl-4">SALIR</button>
               ) : (
                 <button onClick={() => setShowAuth(true)} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-amber-500 transition shadow-lg">Entrar</button>
               )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12">
        <Routes>
          {/* CATALOGO */}
          <Route path="/" element={
             <>
               {search.length > 0 ? (
                   <div className="max-w-7xl mx-auto px-4 mt-8 min-h-screen">
                       <div className="flex flex-col md:flex-row gap-4 mb-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-lg">
                           <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
                           <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
                       </div>
                       <h2 className="text-2xl font-serif text-white mb-6">Resultados para "{search}"</h2>
                       {filteredProducts.length === 0 ? <p className="text-zinc-500">Sin resultados.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} />)}</div>}
                   </div>
               ) : (
                   <>
                       <div className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden mb-16">
                           <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600" alt="Hero" className="absolute inset-0 w-full h-full object-cover grayscale" />
                           <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-zinc-950"></div>
                           <div className="relative z-10 text-center px-4 max-w-4xl">
                               <h2 className="text-5xl md:text-8xl font-serif font-black mb-6 tracking-tighter leading-none bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 bg-clip-text text-transparent animate-fade-in">PARA AMANTES DEL CAFÉ</h2>
                               <div className="flex items-center justify-center gap-4"><div className="h-[1px] w-12 md:w-24 bg-amber-600"></div><p className="text-amber-500 text-lg md:text-2xl font-light tracking-[0.5em] uppercase">EL GRANO DE ORO</p><div className="h-[1px] w-12 md:w-24 bg-amber-600"></div></div>
                           </div>
                       </div>
                       <div className="max-w-7xl mx-auto px-4">
                           <div className="flex flex-col md:flex-row gap-4 mb-12 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                               <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
                               <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
                           </div>
                           
                           {recommendations.length > 0 && category === 'all' && (
                               <section className="mb-16">
                                   <h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">
                                       {user ? "Recomendaciones para ti" : "Los cafés más populares"}
                                       <div className="h-px bg-amber-900/30 flex-1"></div>
                                   </h2>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                       {recommendations.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} recommended={true} />)}
                                   </div>
                               </section>
                           )}
                           
                           <section><h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">Nuestra colección completa <div className="h-px bg-zinc-800 flex-1"></div></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} />)}</div></section>
                       </div>
                   </>
               )}
             </>
          } />

          {/* DETALLE */}
          <Route path="/product/:id" element={<ProductDetailWrapper products={products} addToCart={addToCart} buyNow={buyNow} toggleWishlist={toggleWishlist} wishlist={wishlist} />} />
          
          {/* CARRITO */}
          <Route path="/cart" element={
              <div className="max-w-4xl mx-auto px-4 mt-10">
                 <h2 className="text-3xl font-serif text-amber-500 mb-8">Tu Cesta</h2>
                 {cart.length === 0 ? <p className="text-zinc-500 text-center">Tu cesta está vacía.</p> : (
                    <div className="space-y-4">
                        {cart.map(i => (
                            <div key={i.id} className="flex flex-col md:flex-row justify-between bg-zinc-900 p-6 rounded-xl border border-zinc-800 items-center gap-4">
                                <div className="flex gap-4 items-center w-full md:w-auto">
                                   <img src={i.image_url} className="w-16 h-16 object-cover rounded" />
                                   <div><h4 className="font-bold text-white line-clamp-1">{i.name}</h4><p className="text-amber-500">{i.price}€</p></div>
                                </div>
                                <div className="flex gap-4 items-center w-full md:w-auto justify-between">
                                   <div className="flex gap-2 bg-zinc-950 rounded-lg p-1 border border-zinc-800"><button onClick={()=>removeFromCart(i)} className="text-zinc-400 hover:text-white px-2">-</button><span className="text-white px-2">{i.qty}</span><button onClick={()=>addToCart(i)} className="text-zinc-400 hover:text-white px-2">+</button></div>
                                   <span className="font-bold text-white">{(i.price * i.qty).toFixed(2)}€</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end mt-8 border-t border-zinc-800 pt-8">
                             <div className="text-right w-full md:w-auto">
                                <p className="text-zinc-400 mb-2">Total</p>
                                <p className="text-4xl font-serif text-amber-500 font-bold mb-6">{cartTotal.toFixed(2)}€</p>
                                <button onClick={() => { if(!user){setShowAuth(true)}else{navigate('/checkout')} }} className="bg-amber-600 text-black px-8 py-3 w-full rounded-xl font-bold hover:bg-amber-500">Tramitar Pedido</button>
                             </div>
                        </div>
                    </div>
                 )}
              </div>
          } />

          {/* WISHLIST */}
          <Route path="/wishlist" element={
              <div className="max-w-4xl mx-auto px-4 mt-10">
                 <h2 className="text-3xl font-serif text-amber-500 mb-8">Tus Favoritos</h2>
                 {wishlist.length === 0 ? <p className="text-zinc-500 text-center">No tienes favoritos aún.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {wishlist.map(i => (
                            <div key={i.id} className="flex gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 items-center">
                                <img src={i.image_url} className="w-20 h-20 object-cover rounded" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{i.name}</h4>
                                    <p className="text-amber-500">{i.price}€</p>
                                </div>
                                <button onClick={()=>{addToCart(i); setWishlist(wishlist.filter(w=>w.id!==i.id))}} className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700">Mover al Carrito</button>
                            </div>
                        ))}
                    </div>
                 )}
              </div>
          } />

          {/* CHECKOUT */}
          <Route path="/checkout" element={
             <div className="max-w-7xl mx-auto px-4 mt-10 animate-fade-in pb-20">
               <h2 className="text-3xl font-serif font-bold text-amber-500 mb-8 text-center">Finalizar Pedido</h2>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <form id="checkout-form" onSubmit={processPayment} className="lg:col-span-2 space-y-8">
                       <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🚚 Dirección de Envío</h3>
                           <div className="space-y-4">
                               <input className="premium-input w-full" placeholder="Dirección completa" required onChange={e => setShipping({...shipping, address: e.target.value})} />
                               <div className="flex gap-4">
                                   <input className="premium-input w-1/2" placeholder="Ciudad" required onChange={e => setShipping({...shipping, city: e.target.value})} />
                                   <input className="premium-input w-1/2" placeholder="Código Postal (00000)" value={shipping.zip} maxLength="5" required onChange={e => setShipping({...shipping, zip: e.target.value.replace(/\D/g, '').slice(0, 5)})} />
                               </div>
                               <input className="premium-input w-full" placeholder="País" required onChange={e => setShipping({...shipping, country: e.target.value})} />
                           </div>
                       </div>
                       <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">💳 Método de Pago</h3>
                           {!useNewCard && savedCards.length > 0 && (
                               <div className="mb-6 space-y-2">
                                   {savedCards.map(card => (
                                       <div key={card.id} className="flex justify-between items-center p-4 rounded-xl border border-amber-500/50 bg-amber-900/10 cursor-pointer">
                                           <div className="flex items-center gap-3">
                                               <span className="text-2xl">💳</span>
                                               <span className="text-white font-mono">**** **** **** {card.last4}</span>
                                           </div>
                                           <span className="text-amber-500 font-bold text-sm">Seleccionada</span>
                                       </div>
                                   ))}
                               </div>
                           )}
                           <button type="button" onClick={() => setUseNewCard(!useNewCard)} className="text-amber-500 hover:text-amber-400 text-sm font-bold underline mb-4 block">
                               {useNewCard ? "← Usar tarjeta guardada" : "+ Añadir nueva tarjeta"}
                           </button>
                           {useNewCard && (
                               <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 animate-fade-in">
                                   <input className="premium-input w-full" placeholder="Titular de la Tarjeta" required onChange={e => setPayment({...payment, holder: e.target.value})} />
                                   <input className="premium-input w-full" placeholder="Número de Tarjeta (16 dígitos)" required maxLength="16" onChange={e => setPayment({...payment, card: e.target.value})} />
                                   <div className="flex gap-4">
                                       <input className="premium-input w-1/2" placeholder="MM/YY" value={payment.expiry} maxLength="5" required onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                            setPayment({...payment, expiry: val});
                                       }} />
                                       <input className="premium-input w-1/2" placeholder="CVV" required maxLength="3" onChange={e => setPayment({...payment, cvv: e.target.value})} />
                                   </div>
                               </div>
                           )}
                       </div>
                   </form>
                   <div className="lg:col-span-1">
                       <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 sticky top-28 shadow-2xl">
                           <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Resumen</h3>
                           <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                               {cart.map(item => (
                                   <div key={item.id} className="flex justify-between text-sm items-center">
                                       <div className="flex items-center gap-2">
                                           <span className="text-amber-500 font-bold">{item.qty}x</span>
                                           <span className="text-zinc-300 truncate w-32">{item.name}</span>
                                       </div>
                                       <span className="text-white font-mono">{(item.price * item.qty).toFixed(2)}€</span>
                                   </div>
                               ))}
                           </div>
                           <div className="border-t border-zinc-800 pt-4 mb-6">
                               <div className="flex justify-between items-end">
                                   <span className="text-zinc-400">Total</span>
                                   <span className="text-3xl font-serif font-bold text-amber-500">{cartTotal.toFixed(2)}€</span>
                               </div>
                           </div>
                           <div className="flex gap-3 flex-col">
                               <button type="submit" form="checkout-form" className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold py-4 rounded-xl hover:opacity-90 transition shadow-lg">PAGAR AHORA</button>
                               <button onClick={() => navigate('/')} className="w-full text-zinc-500 hover:text-white py-2 transition text-sm">Cancelar</button>
                           </div>
                       </div>
                   </div>
               </div>
             </div>
          } />

          {/* ADMIN */}
          <Route path="/admin" element={
            <div className="animate-fade-in max-w-7xl mx-auto px-4 mt-10 pb-20">
              <h2 className="text-3xl font-serif font-bold text-white mb-8 border-b border-zinc-800 pb-4">Dashboard Admin</h2>
              
              {/* IA INSIGHTS Y BOTÓN DE INYECCIÓN DE DATOS */}
              <div className="flex items-center gap-3 mb-4 justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-2xl">🤖</span>
                   <h3 className="text-xl font-bold text-white">Inteligencia Artificial</h3>
                </div>
                <button onClick={handleSeedAIData} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 px-3 py-1 rounded hover:bg-indigo-500 hover:text-white transition shadow-[0_0_10px_rgba(99,102,241,0.2)]">⚙️ Inyectar Datos Falsos (Test)</button>
              </div>

              {aiInsights && (
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl border border-indigo-500/30 mb-8 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 p-4 rounded-xl"><p className="text-indigo-300 text-xs uppercase font-bold">Hora Pico</p><p className="text-2xl text-white">{aiInsights.hora_pico_ventas}:00 hs</p></div>
                    <div className="bg-black/30 p-4 rounded-xl"><p className="text-purple-300 text-xs uppercase font-bold">Conversión</p><p className="text-2xl text-white">{aiInsights.tasa_conversion}%</p></div>
                    <div className="bg-black/30 p-4 rounded-xl"><p className="text-emerald-300 text-xs uppercase font-bold">Consejo IA</p><p className="text-sm text-white italic">"{aiInsights.consejo_ia}"</p></div>
                  </div>
                </div>
              )}

              {/* RESÚMENES FINANCIEROS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                 <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-xs uppercase font-bold mb-1">Hoy</p><p className="text-2xl font-serif text-white">{salesToday.toFixed(2)}€</p></div>
                 <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-xs uppercase font-bold mb-1">Esta Semana</p><p className="text-2xl font-serif text-white">{salesWeek.toFixed(2)}€</p></div>
                 <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800"><p className="text-zinc-400 text-xs uppercase font-bold mb-1">Este Mes</p><p className="text-2xl font-serif text-white">{salesMonth.toFixed(2)}€</p></div>
                 <div className="bg-amber-900/20 p-5 rounded-2xl border border-amber-500/30"><p className="text-amber-500/80 text-xs uppercase font-bold mb-1">Este Año</p><p className="text-2xl font-serif text-amber-500">{salesYear.toFixed(2)}€</p></div>
              </div>

              <div className="mb-8"><SalesChart orders={orders} /></div>
              
              {/* GESTIÓN DE INVENTARIO CON BOTÓN DE GUARDADO MASIVO */}
              <div className="flex justify-between items-end mb-4">
                  <h3 className="text-2xl font-bold text-white">📦 Gestión de Inventario</h3>
                  {Object.keys(stockEdits).length > 0 && (
                      <button onClick={handleBulkUpdateStock} className="bg-amber-600 text-black px-6 py-2 rounded-lg font-bold hover:bg-amber-500 transition animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                          💾 Guardar Todos los Cambios ({Object.keys(stockEdits).length})
                      </button>
                  )}
              </div>
              
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto mb-12">
                <table className="w-full text-left text-sm text-zinc-400 min-w-[600px]">
                  <thead className="bg-zinc-950 text-zinc-300 font-bold border-b border-zinc-800">
                    <tr><th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4">Precio</th><th className="p-4">Stock Múltiple</th><th className="p-4 text-right">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                        <td className="p-4 flex items-center gap-3"><img src={p.image_url} className="w-10 h-10 rounded object-cover" /><span className="text-white font-bold">{p.name}</span></td>
                        <td className="p-4">{p.category}</td>
                        <td className="p-4">{p.price}€</td>
                        <td className="p-4">
                           <input 
                               type="number" 
                               value={stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock} 
                               onChange={(e) => handleStockChange(p.id, e.target.value)} 
                               className={`bg-zinc-950 border rounded px-3 py-2 w-24 text-white outline-none transition-colors ${stockEdits[p.id] !== undefined ? 'border-amber-500 bg-amber-900/10' : 'border-zinc-700 focus:border-zinc-500'}`} 
                           />
                        </td>
                        <td className="p-4 text-right">
                           <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition border border-red-500/30 bg-red-900/10">Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AÑADIR PRODUCTOS Y ENVÍOS */}
              <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                     <h3 className="text-xl font-bold mb-4 text-amber-500">Pedidos a Enviar</h3>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {orders.filter(o => o.status === 'pending').map(order => (
                          <div key={order.id} className="p-4 bg-black/40 rounded-xl border border-zinc-800 flex justify-between items-center">
                             <div><p className="text-white font-bold">Pedido #{order.id}</p><p className="text-sm text-zinc-400">{order.items_summary || order.items}</p><p className="text-xs text-zinc-500 italic">{order.user_email || order.user} - {order.address}</p></div>
                             <button onClick={() => handleShipOrder(order.id)} className="bg-amber-600 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition">Completar</button>
                          </div>
                       ))}
                       {orders.filter(o => o.status === 'pending').length === 0 && <p className="text-zinc-500 text-sm">Todo enviado.</p>}
                     </div>
                  </div>
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                     <h3 className="text-xl font-bold mb-4 text-white">Añadir Producto</h3>
                     <form onSubmit={handleCreateProduct} className="space-y-4">
                         <input name="name" className="premium-input w-full" placeholder="Nombre" required />
                         <input name="category" className="premium-input w-full" placeholder="Categoría" required />
                         <input name="price" type="number" step="0.01" className="premium-input w-full" placeholder="Precio (€)" required />
                         <input name="stock" type="number" className="premium-input w-full" placeholder="Stock Inicial" required />
                         <input name="image_url" className="premium-input w-full" placeholder="URL de Imagen" />
                         <textarea name="description" className="premium-input w-full" placeholder="Descripción" rows="3" />
                         <button type="submit" className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition">Añadir</button>
                     </form>
                  </div>
              </div>
            </div>
          } />
        </Routes>
      </main>

      <style>{`.premium-input { background: #09090b; border: 1px solid #27272a; color: white; padding: 0.8rem 1.2rem; border-radius: 1rem; outline: none; transition: 0.3s; } .premium-input:focus { border-color: #f59e0b; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }`}</style>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); localStorage.setItem('user', JSON.stringify(u)); setShowAuth(false); }} />}
    </div>
  );
}

// --- COMPONENTS EXTRA ---
export default App;