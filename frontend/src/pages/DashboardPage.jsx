import { useState, useEffect } from 'react'
import api from '../api/axios'
import {
  Banknote,
  Landmark,
  Building2,
  FileCheck,
  AlertCircle,
} from 'lucide-react'

const cardConfig = [
  {
    key: 'saldo_efectivo',
    label: 'Saldo Efectivo',
    icon: Banknote,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    key: 'saldo_bna',
    label: 'Saldo BNA',
    icon: Landmark,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    key: 'saldo_bbva',
    label: 'Saldo BBVA',
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    key: 'total_cheques_cartera',
    label: 'Cheques en Cartera',
    icon: FileCheck,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    subKey: 'cantidad_cheques_cartera',
    subLabel: 'cheques',
  },
  {
    key: 'cuentas_por_cobrar',
    label: 'Cuentas por Cobrar',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value || 0)
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResumen()
  }, [])

  const fetchResumen = async () => {
    try {
      const { data } = await api.get('/dashboard/resumen')
      setResumen(data)
    } catch (err) {
      console.error('Error cargando resumen:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cardConfig.map((card) => {
          const Icon = card.icon
          const value = resumen?.[card.key] ?? 0
          const subValue = card.subKey ? resumen?.[card.subKey] : null

          return (
            <div
              key={card.key}
              id={`card-${card.key}`}
              className={`bg-white rounded-xl border ${card.border} p-5 shadow-card hover:shadow-card-hover transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-500 mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {formatCurrency(value)}
                  </p>
                  {subValue !== null && (
                    <p className="text-xs text-surface-400 mt-1">
                      {subValue} {card.subLabel}
                    </p>
                  )}
                </div>
                <div className={`${card.bg} p-2.5 rounded-lg`}>
                  <Icon size={22} className={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info placeholder */}
      <div className="bg-white rounded-xl border border-surface-200 p-8 text-center shadow-card">
        <p className="text-surface-400 text-sm">
          Los saldos se actualizan automáticamente con cada operación registrada en el sistema.
        </p>
      </div>
    </div>
  )
}
