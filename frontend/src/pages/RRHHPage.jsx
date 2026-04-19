import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { Plus, User } from 'lucide-react'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)
}

const ORIGENES_FONDO = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'BNA', label: 'BNA' },
  { value: 'BBVA', label: 'BBVA' },
]

export default function RRHHPage() {
  const [empleados, setEmpleados] = useState([])
  const [selectedEmpleado, setSelectedEmpleado] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMovModal, setShowMovModal] = useState(false)
  const [showEmpleadoModal, setShowEmpleadoModal] = useState(false)
  const [nuevoEmpleado, setNuevoEmpleado] = useState('')

  const [movForm, setMovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    tipo: 'ingreso',
    monto: '',
    origen_fondo_pago: 'Efectivo',
  })

  const fetchEmpleados = useCallback(async () => {
    try {
      const { data } = await api.get('/empleados/')
      setEmpleados(data)
      if (data.length > 0 && !selectedEmpleado) {
        setSelectedEmpleado(data[0])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  const fetchFicha = useCallback(async (id) => {
    try {
      const [fichaRes, movsRes] = await Promise.all([
        api.get(`/rrhh/ficha/${id}`),
        api.get(`/rrhh/movimientos/${id}`),
      ])
      setFicha(fichaRes.data)
      setMovimientos(movsRes.data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => { fetchEmpleados() }, [fetchEmpleados])
  useEffect(() => {
    if (selectedEmpleado) fetchFicha(selectedEmpleado.id)
  }, [selectedEmpleado, fetchFicha])

  const handleCrearMovimiento = async (e) => {
    e.preventDefault()
    const payload = {
      empleado_id: selectedEmpleado.id,
      fecha: movForm.fecha,
      concepto: movForm.concepto,
      ingreso: movForm.tipo === 'ingreso' ? parseFloat(movForm.monto) : 0,
      egreso: movForm.tipo === 'egreso' ? parseFloat(movForm.monto) : 0,
      origen_fondo_pago: movForm.tipo === 'egreso' ? movForm.origen_fondo_pago : null,
    }
    try {
      await api.post('/rrhh/movimientos', payload)
      const msg = movForm.tipo === 'egreso'
        ? '✓ Pago registrado — Caja Diaria actualizada (2 registros)'
        : '✓ Ingreso registrado al empleado'
      toast.success(msg)
      setShowMovModal(false)
      setMovForm({ fecha: new Date().toISOString().split('T')[0], concepto: '', tipo: 'ingreso', monto: '', origen_fondo_pago: 'Efectivo' })
      fetchFicha(selectedEmpleado.id)
    } catch (err) { /* interceptor */ }
  }

  const handleCrearEmpleado = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/empleados/', { nombre: nuevoEmpleado })
      toast.success('✓ Empleado creado')
      setEmpleados([...empleados, data])
      setSelectedEmpleado(data)
      setShowEmpleadoModal(false)
      setNuevoEmpleado('')
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
          <select
            value={selectedEmpleado?.id || ''}
            onChange={(e) => {
              const emp = empleados.find((em) => em.id === parseInt(e.target.value))
              setSelectedEmpleado(emp)
            }}
            className="px-3 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            id="select-empleado"
          >
            {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <button onClick={() => setShowEmpleadoModal(true)}
            className="p-2.5 border border-surface-200 rounded-lg text-surface-500 hover:bg-surface-50">
            <Plus size={16} />
          </button>
        </div>
        <button onClick={() => setShowMovModal(true)} disabled={!selectedEmpleado}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50"
          id="btn-nuevo-movimiento">
          <Plus size={16} />
          Nuevo Movimiento
        </button>
      </div>

      {/* Ficha del empleado */}
      {ficha && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-green-200 p-5 shadow-card">
            <p className="text-sm font-medium text-surface-500 mb-1">Total Ingresos</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(ficha.total_ingresos)}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-card">
            <p className="text-sm font-medium text-surface-500 mb-1">Total Egresos</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(ficha.total_egresos)}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-card">
            <p className="text-sm font-medium text-surface-500 mb-1">Saldo (se le debe)</p>
            <p className={`text-2xl font-bold ${ficha.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(ficha.saldo)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla movimientos */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Concepto</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Ingreso</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Egreso</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Origen Fondo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {movimientos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-surface-400">Sin movimientos</td></tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{m.fecha}</td>
                    <td className="px-4 py-3 font-medium text-surface-800">{m.concepto}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{m.ingreso > 0 ? formatCurrency(m.ingreso) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{m.egreso > 0 ? formatCurrency(m.egreso) : '—'}</td>
                    <td className="px-4 py-3 text-surface-500">{m.origen_fondo_pago || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Movimiento */}
      <Modal isOpen={showMovModal} onClose={() => setShowMovModal(false)} title={`Movimiento — ${selectedEmpleado?.nombre}`}>
        <form onSubmit={handleCrearMovimiento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha</label>
              <input type="date" value={movForm.fecha} onChange={(e) => setMovForm({...movForm, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Tipo</label>
              <select value={movForm.tipo} onChange={(e) => setMovForm({...movForm, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="ingreso">Ingreso (trabajo ganado)</option>
                <option value="egreso">Egreso (pago al empleado)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Concepto</label>
            <input type="text" value={movForm.concepto} onChange={(e) => setMovForm({...movForm, concepto: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Trabajo motor Ford Focus" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Monto</label>
            <input type="number" step="0.01" value={movForm.monto} onChange={(e) => setMovForm({...movForm, monto: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00" required />
          </div>
          {movForm.tipo === 'egreso' && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <label className="block text-sm font-medium text-amber-800 mb-1">Origen del fondo</label>
              <select value={movForm.origen_fondo_pago} onChange={(e) => setMovForm({...movForm, origen_fondo_pago: e.target.value})}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {ORIGENES_FONDO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-xs text-amber-600 mt-2">Se generarán 2 registros automáticos en Caja Diaria</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowMovModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98]">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Empleado */}
      <Modal isOpen={showEmpleadoModal} onClose={() => setShowEmpleadoModal(false)} title="Nuevo Empleado" size="sm">
        <form onSubmit={handleCrearEmpleado} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nombre</label>
            <input type="text" value={nuevoEmpleado} onChange={(e) => setNuevoEmpleado(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre del empleado" required autoFocus />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowEmpleadoModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">Crear</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
