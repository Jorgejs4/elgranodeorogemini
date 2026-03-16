import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const ProductCard = ({ product, isRecommended, onAdd, onClick, isLiked, onLike }) => {
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAdd) onAdd(product);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) onLike(product);
  };

  return (
    <div 
      onClick={onClick}
      className={`relative p-0 overflow-hidden rounded-[1.5rem] bg-[#080808] border border-white/5 transition-all duration-500 cursor-pointer hover:border-[#d4af37]/50 group ${product.stock <= 0 ? 'grayscale opacity-40' : 'active:scale-95'}`}
    >
      {/* DISTINTIVO TÉCNICO */}
      {isRecommended && product.stock > 0 && (
        <span className="absolute top-6 left-6 bg-[#d4af37] text-black text-[7px] font-black px-3 py-1 rounded-sm uppercase tracking-[0.3em] z-20 shadow-2xl">
          Edición Limitada
        </span>
      )}

      {product.stock <= 0 && (
        <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center">
          <span className="text-white text-[9px] font-black px-4 py-2 border border-[#d4af37]/30 uppercase tracking-[0.4em]">
            Sin Existencias
          </span>
        </div>
      )}

      <button 
        onClick={handleLike} 
        className="absolute top-6 right-6 text-xl drop-shadow-lg transition group-hover:text-[#d4af37] z-40"
      >
        {isLiked ? <span className="text-[#d4af37]">♥</span> : <span className="text-white/10">♡</span>}
      </button>

      {/* IMAGEN ESTILO EDITORIAL */}
      <div className="aspect-[3/4] overflow-hidden bg-black relative">
        <img 
          src={product.image_url || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400"} 
          alt={product.name} 
          className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-105 group-hover:brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-90"></div>
      </div>

      <div className="p-8 pb-10 space-y-6">
        <div className="space-y-1">
          <p className="text-[#d4af37] text-[8px] font-black uppercase tracking-[0.5em] opacity-80">{product.category}</p>
          <h3 className="text-white font-serif text-2xl leading-none tracking-tight">{product.name}</h3>
        </div>
        
        <div className="flex items-center justify-between border-t border-white/5 pt-6">
          <div className="flex flex-col">
            <span className="text-white/20 text-[7px] uppercase tracking-[0.3em] font-bold mb-1">Precio Unitario</span>
            <p className="text-2xl font-serif text-white">{product.price.toFixed(2)}<span className="text-[#d4af37] ml-1">€</span></p>
          </div>
          <button 
            onClick={handleAddToCart}
            className={`h-10 px-6 flex items-center justify-center rounded-full border border-[#d4af37] text-[#d4af37] font-black text-[9px] uppercase tracking-[0.2em] transition-all hover:bg-[#d4af37] hover:text-black active:scale-90 ${product.stock <= 0 ? 'hidden' : ''}`}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        stock: PropTypes.number.isRequired,
        image_url: PropTypes.string,
    }).isRequired,
    isRecommended: PropTypes.bool,
    onAdd: PropTypes.func,
    onBuy: PropTypes.func,
    onClick: PropTypes.func,
    isLiked: PropTypes.bool,
    onLike: PropTypes.func
};

export default ProductCard;
