import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_URL = 'https://backend-ai-e3o2.onrender.com/api';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(null);
  const messagesEndRef = useRef(null);

  // Desplazar automáticamente al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enviar pregunta al endpoint /ask
  const handleSendQuestion = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/ask`, { question: input });
      const data = response.data;

      const botMessage = {
        text: data.answer || data.message,
        sender: 'bot',
        options: data.options || null,
      };
      setMessages((prev) => [...prev, botMessage]);
      setOptions(data.options || null);
    } catch (error) {
      const errorMessage = {
        text: 'Error al conectar con el servidor. ¿Intentamos de nuevo?',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar opciones (provideAnswer o searchWeb)
  const handleOption = async (option) => {
    setLoading(true);
    const lastQuestion = messages.find((msg) => msg.sender === 'user')?.text;

    try {
      if (option === 'provideAnswer') {
        const userAnswer = prompt('Por favor, ingresa tu respuesta:');
        if (!userAnswer) {
          setLoading(false);
          return;
        }
        const response = await axios.post(`${BASE_URL}/handleResponse`, {
          question: lastQuestion,
          option,
          userAnswer,
        });
        const data = response.data;
        setMessages((prev) => [
          ...prev,
          { text: data.answer || data.message, sender: 'bot' },
        ]);
      } else if (option === 'searchWeb') {
        const response = await axios.post(`${BASE_URL}/handleResponse`, {
          question: lastQuestion,
          option,
          confirmWeb: false, // Primero obtenemos preview
        });
        const data = response.data;
        setMessages((prev) => [
          ...prev,
          { text: data.preview || data.message, sender: 'bot' },
        ]);

        if (data.preview) {
          const confirm = window.confirm('¿Quieres guardar esta respuesta?');
          if (confirm) {
            const saveResponse = await axios.post(`${BASE_URL}/handleResponse`, {
              question: lastQuestion,
              option,
              confirmWeb: true,
            });
            const saveData = saveResponse.data;
            setMessages((prev) => [
              ...prev,
              { text: saveData.message, sender: 'bot' },
            ]);
          }
        }
      }
      setOptions(null);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: 'Error procesando la opción. Intenta de nuevo.', sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, height: 500, border: '1px solid #ccc', margin: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* Área de mensajes */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <div style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', marginBottom: '10px' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  background: msg.sender === 'user' ? '#007bff' : '#e9ecef',
                  color: msg.sender === 'user' ? 'white' : 'black',
                  borderRadius: '8px',
                  maxWidth: '70%',
                }}
              >
                {msg.text}
              </div>
            </div>
            {msg.options && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                {msg.options.map((opt) => (
                  <button
                    key={opt}
                    style={{
                      margin: '0 5px',
                      padding: '5px 10px',
                      background: loading ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => handleOption(opt)}
                    disabled={loading}
                  >
                    {opt === 'provideAnswer' ? 'Dar Respuesta' : 'Buscar en Web'}
                  </button>
                ))}
              </div>
            )}
            <hr style={{ margin: '10px 0' }} />
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <span>Cargando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de entrada */}
      <div style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
          disabled={loading}
          style={{ flexGrow: 1, padding: '5px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          placeholder="Escribe tu pregunta..."
        />
        <button
          onClick={handleSendQuestion}
          disabled={loading || !input.trim()}
          style={{
            padding: '5px 10px',
            background: loading || !input.trim() ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ChatBox;