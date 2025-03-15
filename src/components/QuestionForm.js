import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  Paper,
  Typography,
} from '@mui/material';

const BASE_URL = 'https://backend-ai-e3o2.onrender.com/';

const ChatBox = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [options, setOptions] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [webPreview, setWebPreview] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Escribe un mensaje');
      return;
    }

    setLoading(true);
    setError('');
    setOptions(null);
    setWebPreview(null);
    setUserAnswer('');

    const userMessage = { type: 'user', text: message.trim(), timestamp: new Date().toLocaleString() };
    setChatHistory((prev) => {
      // Evitar duplicados comparando el texto y tipo
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.type === userMessage.type && lastMessage?.text === userMessage.text) {
        return prev;
      }
      return [...prev, userMessage];
    });

    try {
      const response = await axios.post(`${BASE_URL}api/ask`, { question: message }, { timeout: 5000 });
      const data = response.data;

      if (data.found) {
        const botMessage = { type: 'bot', text: data.answer, timestamp: new Date().toLocaleString() };
        if (data.answer.includes('¿Otro') || data.answer.includes('otro?')) {
          botMessage.isJoke = true;
        }
        setChatHistory((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === botMessage.type && lastMessage?.text === botMessage.text) {
            return prev;
          }
          return [...prev, botMessage];
        });
      } else {
        setOptions(data.options);
        setPendingQuestion(message.trim());
        const botMessage = {
          type: 'bot',
          text: data.message || 'No tengo una respuesta para eso. ¿Qué quieres hacer?',
          isOptions: true,
          timestamp: new Date().toLocaleString(),
        };
        setChatHistory((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.type === botMessage.type && lastMessage?.text === botMessage.text) {
            return prev;
          }
          return [...prev, botMessage];
        });
      }
    } catch (error) {
      const errorText = error.response?.data?.message || 'Uy, algo salió mal. ¿Intentamos de nuevo?';
      const botMessage = { type: 'bot', text: errorText, timestamp: new Date().toLocaleString() };
      setChatHistory((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const handleOption = async (option) => {
    setLoading(true);
    try {
      if (option === 'provideAnswer') {
        if (!userAnswer.trim()) {
          setError('Escribe una respuesta');
          setLoading(false);
          return;
        }
        const response = await axios.post(`${BASE_URL}api/handleResponse`, {
          question: pendingQuestion,
          option,
          userAnswer,
        });
        if (response.data.success) {
          const botMessage = {
            type: 'bot',
            text: response.data.message || `¡Gracias! Guardé tu respuesta: ${response.data.answer}`,
            timestamp: new Date().toLocaleString(),
          };
          setChatHistory((prev) => [...prev, botMessage]);
          setOptions(null);
          setUserAnswer('');
          setPendingQuestion(null);
        }
      } else if (option === 'searchWeb') {
        const response = await axios.post(`${BASE_URL}api/handleResponse`, {
          question: pendingQuestion,
          option,
        });
        if (response.data.preview) {
          setWebPreview(response.data.preview);
          const botMessage = {
            type: 'bot',
            text: response.data.preview,
            isWebPreview: true,
            timestamp: new Date().toLocaleString(),
          };
          setChatHistory((prev) => [...prev, botMessage]);
        } else {
          const botMessage = { type: 'bot', text: 'No encontré nada útil en la web. ¿Otra idea?', timestamp: new Date().toLocaleString() };
          setChatHistory((prev) => [...prev, botMessage]);
          setOptions(null);
          setPendingQuestion(null);
        }
      }
    } catch (error) {
      const errorText = error.response?.data?.message || 'Error al procesar la opción';
      const botMessage = { type: 'bot', text: errorText, timestamp: new Date().toLocaleString() };
      setChatHistory((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWeb = async (confirm) => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}api/handleResponse`, {
        question: pendingQuestion,
        option: 'searchWeb',
        confirmWeb: confirm,
      });
      if (confirm && response.data.success) {
        const botMessage = {
          type: 'bot',
          text: response.data.message || '¡Guardado! Esa respuesta ya está en mi memoria.',
          timestamp: new Date().toLocaleString(),
        };
        setChatHistory((prev) => [...prev, botMessage]);
      } else if (!confirm) {
        const botMessage = { type: 'bot', text: 'Vale, no lo guardo. ¿Qué más quieres hacer?', timestamp: new Date().toLocaleString() };
        setChatHistory((prev) => [...prev, botMessage]);
      }
      setOptions(null);
      setWebPreview(null);
      setPendingQuestion(null);
    } catch (error) {
      const errorText = error.response?.data?.message || 'Error al confirmar la respuesta';
      const botMessage = { type: 'bot', text: errorText, timestamp: new Date().toLocaleString() };
      setChatHistory((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnotherJoke = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}api/ask`, { question: 'Dime otro chiste' }, { timeout: 5000 });
      const botMessage = {
        type: 'bot',
        text: response.data.answer,
        isJoke: true,
        timestamp: new Date().toLocaleString(),
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage = { type: 'bot', text: 'Uy, se me acabaron los chistes por ahora.', timestamp: new Date().toLocaleString() };
      setChatHistory((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Historial de chat */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
        <List>
          {chatHistory.map((msg, index) => (
            <ListItem key={index} sx={{ justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
              <Box>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    bgcolor: msg.type === 'user' ? '#e3f2fd' : '#fff',
                    maxWidth: '70%',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {msg.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {msg.timestamp}
                  </Typography>
                </Paper>
                {msg.isOptions && options && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOption('provideAnswer')}
                    >
                      Dar mi respuesta
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOption('searchWeb')}
                    >
                      Buscar en internet
                    </Button>
                  </Box>
                )}
                {msg.isWebPreview && webPreview && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleConfirmWeb(true)}
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleConfirmWeb(false)}
                    >
                      Descartar
                    </Button>
                  </Box>
                )}
                {msg.isJoke && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAnotherJoke}
                      disabled={loading}
                    >
                      Otro chiste
                    </Button>
                  </Box>
                )}
              </Box>
            </ListItem>
          ))}
          <div ref={chatEndRef} />
        </List>
      </Box>

      {options && options.includes('provideAnswer') && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Escribe tu respuesta..."
            variant="outlined"
            size="small"
            error={!!error}
            helperText={error}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          variant="outlined"
          placeholder="Escribe tu mensaje..."
          size="small"
          error={!!error}
          helperText={error}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Enviar'}
        </Button>
      </Box>
    </Box>
  );
};

export default ChatBox;