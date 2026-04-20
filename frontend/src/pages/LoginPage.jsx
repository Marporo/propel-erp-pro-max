import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const success = await login(username, password)
    setIsLoading(false)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <span className="text-3xl font-bold text-white tracking-tighter block transform rotate-6">P</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-surface-900">
          Propel ERP Pro Max
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600">
          Acceso seguro al sistema administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-modal sm:rounded-xl sm:px-10 border border-surface-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-surface-700">Usuario</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-surface-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ingresá tu usuario"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-surface-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ingresá tu contraseña"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
