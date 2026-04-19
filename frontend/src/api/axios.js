/**
 * Instancia Axios configurada para conectar con la API de Propel ERP.
 * Usa el proxy de Vite en desarrollo (/api → localhost:8000/api).
 */
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respuesta para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'Error de conexión con el servidor';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
