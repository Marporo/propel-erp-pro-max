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
// Inyectar Token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si da 401, podríamos disparar un evento de logout, pero el AuthContext lo maneja
    const message = error.response?.data?.detail || 'Error de conexión con el servidor'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
);

export default api;
