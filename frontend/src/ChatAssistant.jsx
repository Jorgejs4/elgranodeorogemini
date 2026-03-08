import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from './store/useStore';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu barista experto de El Grano de Oro. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '☕ Perdona, he tenido un problema con la molienda. Inténtalo de nuevo más tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-amber-500 transition-all hover:scale-110 active:scale-95 border-2 border-amber-400/50"
      >
        {isOpen ? (
          <span className="text-white text-2xl">✕</span>
        ) : (
          <span className="text-white text-2xl">💬</span>
        )}
      </button>

      {/* VENTANA DE CHAT */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* HEADER */}
          <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-xl">☕</div>
            <div>
              <h3 className="text-white font-bold text-sm">Barista Experto</h3>
              <p className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest">En línea</p>
            </div>
          </div>

          {/* MENSAJES */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-zinc-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 p-3 rounded-2xl rounded-tl-none border border-zinc-700 text-xs italic animate-pulse">
                  El barista está escribiendo...
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <form onSubmit={handleSend} className="p-4 bg-zinc-800 border-t border-zinc-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame sobre café..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-amber-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
