const ProductCard = ({ product, isRecommended, onAdd, onBuy, onClick, isLiked, onLike }) => {
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAdd) onAdd(product);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (onBuy) onBuy(product);
  };

  return (
    <div 
      onClick={onClick}
      className={`relative group p-4 rounded-xl bg-[#1A1A1A] border ${isRecommended ? 'border-[#D4AF37]' : 'border-white/5'} transition-all duration-500 hover:scale-105 cursor-pointer`}
    >
      
      {isRecommended && (
        <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter z-10">
          Especial para ti
        </span>
      )}

      <button 
        onClick={(e) => { e.stopPropagation(); if(onLike) onLike(product); }} 
        className="absolute top-4 right-4 text-2xl drop-shadow-lg transition hover:scale-125 z-20"
      >
        {isLiked ? <span className="text-amber-500">♥</span> : <span className="text-zinc-300">♡</span>}
      </button>

      <div className="overflow-hidden rounded-lg bg-black/40 mb-4">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400'} 
          alt={product.name}
          className="w-full h-48 object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
        />
      </div>

      <div className="flex justify-between items-start mb-1">
        <h3 className="text-lg font-serif tracking-wide truncate flex-1">{product.name}</h3>
        <span className="text-[#D4AF37] font-bold ml-2">{product.price}€</span>
      </div>
      <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Stock: {product.stock}</p>

      <div className="flex gap-2">
        <button 
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className={`flex-1 py-2 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors duration-300 uppercase text-[10px] tracking-widest font-semibold ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {product.stock > 0 ? 'Añadir' : 'Agotado'}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className={`flex-1 py-2 bg-[#D4AF37] text-black border border-[#D4AF37] hover:bg-transparent hover:text-[#D4AF37] transition-colors duration-300 uppercase text-[10px] tracking-widest font-semibold ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Comprar
        </button>
      </div>
    </div>
  );
};

export default ProductCard;