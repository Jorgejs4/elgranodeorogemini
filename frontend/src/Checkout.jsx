import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// URL de tu API en Render
const API_BASE_URL = 'https://grano-oro-api.onrender.com';

function Checkout() {
  const { state } = useLocation(); 
  const cart = state?.cart || [];
  const user = state?.user || null; // Recibimos el usuario desde el estado de navegación
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({ address: '', city: '', country: '', zip: '' });
  const [payment, setPayment] = useState({ card_number: '', expiry: '', cvv: '', card_holder: '' });
  const [savedCards] = useState([{ id: 1, last4: '4242', brand: 'Visa' }]);
  const [useNewCard, setUseNewCard] = useState(false);

  // Calcular total correctamente
  const total = cart.reduce((sum, item) => sum + item.price * (item.qty || item.quantity || 1), 0);

  const handlePay = async (e) => {
    e.preventDefault();

    if (!user) {
        alert("Debes estar logueado para comprar");
        return;
    }

    // Ajustamos el objeto exacto que pide tu esquema de FastAPI
    const orderData = {
      user: user.email,
      total: total,
      address: `${shipping.address}, ${shipping.city}, ${shipping.zip}`,
      items: cart.map(p => ({
        id: p.id,
        name: p.name,
        qty: p.qty || p.quantity || 1,
        price: p.price
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert('¡Pago realizado con éxito! ☕ El stock ha sido actualizado.');
        navigate('/'); 
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'No se pudo procesar el pedido'));
      }
    } catch (err) {
      alert('Error de conexión con el servidor de Render');
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 mt-20 text-zinc-800">
      <div className="md:w-2/3 bg-white p-6 rounded shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🚚 Dirección de Envío</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <input className="border p-2 rounded col-span-2" placeholder="Dirección completa" 
            onChange={e => setShipping({...shipping, address: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Ciudad" 
            onChange={e => setShipping({...shipping, city: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Código Postal" 
            onChange={e => setShipping({...shipping, zip: e.target.value})} />
        </div>

        <h2 className="text-2xl font-bold mb-4">💳 Método de Pago</h2>
        <div className="mb-4">
          {!useNewCard && (
            <div className="border p-3 rounded mb-2 bg-blue-50 border-blue-200 flex justify-between">
              <span>xxxx-xxxx-xxxx-4242 (Visa)</span>
              <span className="text-green-600 font-bold">Seleccionada</span>
            </div>
          )}
          <button type="button" className="text-sm text-blue-600 underline" onClick={() => setUseNewCard(!useNewCard)}>
            {useNewCard ? "Usar tarjeta guardada" : "Añadir nueva tarjeta"}
          </button>
        </div>

        {useNewCard && (
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <input className="border p-2 rounded col-span-2" placeholder="Número de Tarjeta" />
            <input className="border p-2 rounded" placeholder="MM/YY" />
            <input className="border p-2 rounded" placeholder="CVV" />
            <input className="border p-2 rounded col-span-2" placeholder="Titular" />
          </div>
        )}
      </div>

      <div className="md:w-1/3 bg-zinc-100 p-6 rounded shadow-lg h-fit">
        <h3 className="text-xl font-bold mb-4">Resumen</h3>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between mb-2 text-sm">
            <span>{item.name} (x{item.qty || item.quantity || 1})</span>
            <span>{(item.price * (item.qty || item.quantity || 1)).toFixed(2)}€</span>
          </div>
        ))}
        <div className="border-t border-gray-300 my-4"></div>
        <div className="flex justify-between font-bold text-xl mb-6">
          <span>Total:</span>
          <span>{total.toFixed(2)}€</span>
        </div>
        <button onClick={handlePay} className="w-full bg-amber-600 text-white py-3 rounded font-bold hover:bg-amber-700 transition">
          PAGAR AHORA
        </button>
      </div>
    </div>
  );
}

export default Checkout;