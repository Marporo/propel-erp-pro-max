import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { Plus, Filter, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)
}

const CATEGORIAS_MANUALES = [
  { value: 'G_Casa', label: 'Gastos Casa' },
  { value: 'G_Banco', label: 'Gastos Banco' },
  { value: 'Casa_Fabi', label: 'Casa Fabi' },
  { value: 'Cordoba', label: 'Córdoba' },
]

const CATEGORIAS_AJUSTE = [
  { value: 'Mov_Efectivo', label: 'Ajuste Efectivo' },
  { value: 'Mov_BNA', label: 'Ajuste BNA' },
  { value: 'Mov_BBVA', label: 'Ajuste BBVA' },
]

const categoriaBadge = {
  Mov_Efectivo: 'bg-green-100 text-green-700',
  Mov_BNA: 'bg-blue-100 text-blue-700',
  Mov_BBVA: 'bg-purple-100 text-purple-700',
  Gasto_Taller: 'bg-orange-100 text-orange-700',
  G_Casa: 'bg-pink-100 text-pink-700',
  G_Banco: 'bg-slate-100 text-slate-700',
  Apps: 'bg-cyan-100 text-cyan-700',
  Casa_Fabi: 'bg-rose-100 text-rose-700',
  Cordoba: 'bg-indigo-100 text-indigo-700',
}

export default function TesoreriaPage() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterCat, setFilterCat] = useState('')

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    categoria_movimiento: 'G_Casa',
    tipo: 'egreso',
    monto: '',
    es_ajuste: false,
  })

  const fetchMovimientos = useCallback(async () => {
    try {
      const params = {}
      if (filterCat) params.categoria = filterCat
      const { data } = await api.get('/caja-diaria/', { params })
      setMovimientos(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [filterCat])

  useEffect(() => { fetchMovimientos() }, [fetchMovimientos])

  const handleCrearMovimiento = async (e) => {
    e.preventDefault()
    const isAjuste = CATEGORIAS_AJUSTE.some((c) => c.value === form.categoria_movimiento)
    try {
      await api.post('/caja-diaria/', {
        fecha: form.fecha,
        concepto: form.concepto,
        categoria_movimiento: form.categoria_movimiento,
        ingreso: form.tipo === 'ingreso' ? parseFloat(form.monto) : 0,
        egreso: form.tipo === 'egreso' ? parseFloat(form.monto) : 0,
        es_ajuste: isAjuste,
      })
      toast.success('✓ Movimiento registrado en Caja Diaria')
      setShowModal(false)
      setForm({ fecha: new Date().toISOString().split('T')[0], concepto: '', categoria_movimiento: 'G_Casa', tipo: 'egreso', monto: '', es_ajuste: false })
      fetchMovimientos()
    } catch (err) { /* interceptor */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-surface-400" />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            id="filter-categoria">
            <option value="">Todas las categorías</option>
            <option value="Mov_Efectivo">Mov. Efectivo</option>
            <option value="Mov_BNA">Mov. BNA</option>
            <option value="Mov_BBVA">Mov. BBVA</option>
            <option value="Gasto_Taller">Gasto Taller</option>
            <option value="G_Casa">Gastos Casa</option>
            <option value="G_Banco">Gastos Banco</option>
            <option value="Apps">Apps</option>
            <option value="Casa_Fabi">Casa Fabi</option>
            <option value="Cordoba">Córdoba</option>
          </select>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all"
          id="btn-nuevo-gasto">
          <Plus size={16} />
          Nuevo Gasto Manual
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Concepto</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">Categoría</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Ingreso</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Egreso</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {movimientos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-surface-400">Sin movimientos</td></tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{m.fecha}</td>
                    <td className="px-4 py-3 font-medium text-surface-800">{m.concepto}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${categoriaBadge[m.categoria_movimiento] || 'bg-surface-100 text-surface-600'}`}>
                        {m.categoria_movimiento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.ingreso > 0 && (
                        <span className="flex items-center justify-end gap-1 text-green-600 font-medium">
                          <ArrowDownCircle size={14} />
                          {formatCurrency(m.ingreso)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.egreso > 0 && (
                        <span className="flex items-center justify-end gap-1 text-red-600 font-medium">
                          <ArrowUpCircle size={14} />
                          {formatCurrency(m.egreso)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${m.es_automatico ? 'text-blue-600' : 'text-surface-400'}`}>
                        {m.es_automatico ? 'Auto' : m.es_ajuste ? 'Ajuste' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Gasto Manual */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Movimiento Manual">
        <form onSubmit={handleCrearMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="egreso">Egreso</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Categoría</label>
            <select value={form.categoria_movimiento} onChange={(e) => setForm({...form, categoria_movimiento: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <optgroup label="Gastos manuales">
                {CATEGORIAS_MANUALES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </optgroup>
              <optgroup label="Ajustes / Correcciones">
                {CATEGORIAS_AJUSTE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Concepto</label>
            <input type="text" value={form.concepto} onChange={(e) => setForm({...form, concepto: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Comisión bancaria, envío a Córdoba..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Monto</label>
            <input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98]">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
