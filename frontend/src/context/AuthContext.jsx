import { createContext, useState, useEffect, useContext } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const { data } = await api.get('/auth/me')
          setUser(data)
        } catch (err) {
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const { data } = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      localStorage.setItem('token', data.access_token)
      
      // Fetch user profile
      const userRes = await api.get('/auth/me')
      setUser(userRes.data)
      toast.success('¡Bienvenido!')
      return true
    } catch (err) {
      toast.error('Usuario o contraseña incorrectos')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Sesión cerrada')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
