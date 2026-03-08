import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import ChatAssistant from './ChatAssistant';
import useStore, { API_BASE_URL } from './store/useStore';

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

// --- COMPONENTE DE GRÁFICO ---
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
  const maxVal = Math.max(...data.map(d => d.val), 10);
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
                    <button onClick={() => addToCart(product)} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl border transition ${product.stock > 0 ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:border-amber-500' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}>Añadir a la Cesta</button>
                    <button onClick={() => { addToCart(product); navigate('/checkout'); }} disabled={product.stock <= 0} className={`flex-1 font-bold py-4 rounded-xl shadow-lg transition ${product.stock > 0 ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:opacity-90' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>Comprar Ahora</button>
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

  useEffect(() => {
    fetchProducts();
    if (user) {
        fetch(`${API_BASE_URL}/cards`, { headers: { 'Authorization': `Bearer ${user.token}` } })
            .then(res => res.json())
            .then(data => setSavedCards(Array.isArray(data) ? data : []))
            .catch(e => console.log(e));
    }
  }, [user, fetchProducts]);

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
  }, [user, setRecommendations]);

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

    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
            body: JSON.stringify({
                user: user.email,
                items: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
                total: cart.reduce((acc, item) => acc + item.price * item.qty, 0),
                address: fullAddress,
                save_card: saveCard,
                card_info: cardInfo
            })
        });
        if (response.ok) {
            alert(`🎉 ¡Pedido confirmado! Pago realizado con éxito.`);
            clearCart(); navigate("/"); fetchProducts();
        } else {
            const err = await response.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (err) { console.error(err); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).filter(p => category === "all" || p.category === category);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 text-sm md:text-base">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2" onClick={() => setSearch("")}>
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">El Grano de Oro</h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
               <LanguageSelector />
               {user && user.role === 'admin' && (
                 <Link to="/admin" className="hidden md:block px-4 py-2 text-sm font-bold text-amber-500 border border-amber-500/50 rounded-full hover:bg-amber-500 hover:text-black transition-all">⚙️ Admin</Link>
               )}
               <Link to="/wishlist" className="relative p-2">
                 <span className={`text-2xl ${wishlist.length > 0 ? 'text-amber-500' : 'text-zinc-300'}`}>♥</span>
                 {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-zinc-100 text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlist.length}</span>}
               </Link>
               <Link to="/cart" className="relative p-2">
                 <span className="text-2xl text-zinc-300">🛒</span>
                 {cart.length > 0 && <span className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{cart.reduce((a,c)=>a+c.qty,0)}</span>}
               </Link>
               {user ? (
                 <button onClick={logout} className="text-xs font-bold text-zinc-400 hover:text-amber-500 ml-2 uppercase tracking-wider border-l border-zinc-700 pl-4">SALIR</button>
               ) : (
                 <button onClick={() => setShowAuth(true)} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-amber-500 transition shadow-lg">Entrar</button>
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
                       <div className="flex flex-col md:flex-row gap-4 mb-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-lg">
                           <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
                           <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
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
                               <h2 className="text-5xl md:text-8xl font-serif font-black mb-6 bg-gradient-to-b from-amber-100 to-amber-600 bg-clip-text text-transparent">EL GRANO DE ORO</h2>
                               <p className="text-amber-500 text-lg md:text-2xl font-light tracking-[0.5em] uppercase">Especialistas en Café</p>
                           </div>
                       </div>
                       <div className="max-w-7xl mx-auto px-4">
                           <div className="flex flex-col md:flex-row gap-4 mb-12 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                               <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
                               <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
                           </div>
                           {recommendations.length > 0 && category === 'all' && (
                               <section className="mb-16">
                                   <h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">{user ? "Para ti" : "Destacados"}<div className="h-px bg-amber-900/30 flex-1"></div></h2>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                       {recommendations.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={() => { addToCart(p); navigate('/checkout'); }} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} isRecommended={true} />)}
                                   </div>
                               </section>
                           )}
                           <section><h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">Catálogo <div className="h-px bg-zinc-800 flex-1"></div></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} onAdd={addToCart} onBuy={() => { addToCart(p); navigate('/checkout'); }} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} />)}</div></section>
                       </div>
                   </>
               )}
             </>
          } />
          <Route path="/product/:id" element={<ProductDetailWrapper />} />
          <Route path="/cart" element={
              <div className="max-w-4xl mx-auto px-4 mt-10">
                 <h2 className="text-3xl font-serif text-amber-500 mb-8">Tu Selección</h2>
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
                            <button onClick={() => { if(!user){setShowAuth(true)}else{navigate('/checkout')} }} className="bg-amber-600 text-black px-12 py-3 rounded-xl font-bold hover:bg-amber-500 transition">Checkout</button>
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
                                   <input className="premium-input w-full" placeholder="Número de tarjeta (Pruéba 4242...)" value={payment.card} onChange={e => setPayment({...payment, card: e.target.value})} required={selectedCardId === 'new'} />
                                   <div className="flex gap-4">
                                       <input className="premium-input w-1/2" placeholder="MM/YY" value={payment.expiry} onChange={e => setPayment({...payment, expiry: e.target.value})} required={selectedCardId === 'new'} />
                                       <input className="premium-input w-1/2" placeholder="CVV" value={payment.cvv} onChange={e => setPayment({...payment, cvv: e.target.value})} required={selectedCardId === 'new'} />
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
              <h2 className="text-3xl font-serif font-bold text-white mb-8 border-b border-zinc-800 pb-4">Admin Dashboard</h2>
              {aiInsights && (
                <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30 mb-8 grid grid-cols-3 gap-4">
                    <div><p className="text-indigo-300 text-xs font-bold">HORA PICO</p><p className="text-2xl">{aiInsights.hora_pico_ventas}:00</p></div>
                    <div><p className="text-purple-300 text-xs font-bold">CONVERSIÓN</p><p className="text-2xl">{aiInsights.tasa_conversion}%</p></div>
                    <div><p className="text-emerald-300 text-xs font-bold">IA TIP</p><p className="text-xs italic">"{aiInsights.consejo_ia}"</p></div>
                </div>
              )}
              <div className="mb-8"><SalesChart orders={orders} /></div>
              <div className="flex justify-between items-end mb-4">
                  <h3 className="text-2xl font-bold">📦 Inventario</h3>
                  {Object.keys(stockEdits).length > 0 && <button onClick={handleBulkUpdateStock} className="bg-amber-600 text-black px-6 py-2 rounded-lg font-bold">Guardar Cambios</button>}
              </div>
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-950 font-bold border-b border-zinc-800">
                    <tr><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-zinc-800/50">
                        <td className="p-4 text-white font-bold">{p.name}</td>
                        <td className="p-4">{p.price}€</td>
                        <td className="p-4">
                           <input type="number" value={stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock} onChange={(e) => setStockEdits({...stockEdits, [p.id]: parseInt(e.target.value)})} className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-20" />
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
        .premium-input { background: #09090b; border: 1px solid #27272a; color: white; padding: 0.8rem 1.2rem; border-radius: 1rem; outline: none; transition: 0.3s; } 
        .premium-input:focus { border-color: #f59e0b; } 
        .animate-fade-in { animation: fadeIn 0.4s ease-out; } 
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
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
                alert("Cuenta creada."); setIsReg(false);
            } else {
                const form = new URLSearchParams(); form.append('username', email); form.append('password', password);
                const res = await fetch(`${API_BASE_URL}/token`, { method: 'POST', body: form });
                if(!res.ok) throw new Error("Credenciales inválidas");
                const data = await res.json();
                onLogin({ email, id: data.user_id, role: data.role, token: data.access_token });
            }
        } catch(err) { alert(err.message); }
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