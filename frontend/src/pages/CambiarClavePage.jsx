import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, ShieldAlert } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function CambiarClavePage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { data } = await api.post('/auth/cambiar-clave-inicial', { nueva_clave: password })
      toast.success('¡Contraseña actualizada con éxito!')
      // Actualizamos el usuario en el contexto
      setUser(data)
      navigate('/')
    } catch (error) {
      // toast error ya es manejado por el interceptor de axios, pero por si acaso:
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 border-4 border-white">
            <ShieldAlert className="text-white w-8 h-8 transform rotate-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-surface-900">
          Protege tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-surface-600 px-4">
          Hola <strong>{user?.nombre_completo || user?.username}</strong>, ingresaste con una contraseña temporal. Por seguridad, debes establecer tu propia contraseña privada.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-modal sm:rounded-2xl sm:px-10 border border-surface-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-surface-700">Nueva Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="Tu nueva contraseña secreta"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">Confirmar Contraseña</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
