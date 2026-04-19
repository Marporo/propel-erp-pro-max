import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { Plus, ArrowRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)
}

function diasColor(dias) {
  if (dias < 0) return 'text-red-600 bg-red-50'
  if (dias <= 15) return 'text-red-600 bg-red-50'
  if (dias <= 30) return 'text-amber-600 bg-amber-50'
  return 'text-green-600 bg-green-50'
}

const CATEGORIAS_DESTINO = [
  { value: 'Gasto_Taller', label: 'Gasto Taller' },
  { value: 'G_Casa', label: 'Gastos Casa' },
  { value: 'G_Banco', label: 'Gastos Banco' },
  { value: 'Casa_Fabi', label: 'Casa Fabi' },
  { value: 'Cordoba', label: 'Córdoba' },
]

export default function ChequesPage() {
  const [tab, setTab] = useState('cartera')
  const [cartera, setCartera] = useState([])
  const [emitidos, setEmitidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [showEmitidoModal, setShowEmitidoModal] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState(null)

  const [estadoForm, setEstadoForm] = useState({
    nuevo_estado: 'Depositado',
    banco_destino: 'BNA',
    destino_nombre: '',
    categoria_caja: 'Gasto_Taller',
  })

  const [emitidoForm, setEmitidoForm] = useState({
    fecha_emision: new Date().toISOString().split('T')[0],
    destino: '',
    numero_cheque: '',
    fecha_vto: '',
    importe: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const [carteraRes, emitidosRes] = await Promise.all([
        api.get('/cheques/cartera'),
        api.get('/cheques/emitidos'),
      ])
      setCartera(carteraRes.data)
      setEmitidos(emitidosRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCambiarEstado = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/cheques/terceros/${selectedCheque.id}/estado`, estadoForm)
      const msg = estadoForm.nuevo_estado === 'Depositado'
        ? '✓ Cheque depositado — Ingreso registrado en Caja Diaria'
        : '✓ Cheque entregado a tercero — Egreso registrado en Caja Diaria'
      toast.success(msg)
      setShowEstadoModal(false)
      fetchData()
    } catch (err) { /* interceptor */ }
  }

  const handleCrearEmitido = async (e) => {
    e.preventDefault()
    try {
      await api.post('/cheques/emitidos', {
        ...emitidoForm,
        importe: parseFloat(emitidoForm.importe),
      })
      toast.success('✓ Cheque emitido registrado')
      setShowEmitidoModal(false)
      setEmitidoForm({ fecha_emision: new Date().toISOString().split('T')[0], destino: '', numero_cheque: '', fecha_vto: '', importe: '' })
      fetchData()
    } catch (err) { /* interceptor */ }
  }

  const handleMarcarPagado = async (chequeId, pagado) => {
    try {
      await api.patch(`/cheques/emitidos/${chequeId}/pagado?pagado=${pagado}`)
      toast.success(pagado ? '✓ Cheque marcado como pagado' : 'Cheque marcado como pendiente')
      fetchData()
    } catch (err) { /* interceptor */ }
  }

  const openEstadoModal = (cheque) => {
    setSelectedCheque(cheque)
    setEstadoForm({
      nuevo_estado: 'Depositado',
      banco_destino: 'BNA',
      destino_nombre: '',
      categoria_caja: 'Gasto_Taller',
    })
    setShowEstadoModal(true)
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
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('cartera')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'cartera' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
          id="tab-cartera"
        >
          Cartera ({cartera.length})
        </button>
        <button
          onClick={() => setTab('emitidos')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'emitidos' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
          id="tab-emitidos"
        >
          Emitidos ({emitidos.length})
        </button>
      </div>

      {/* Tab: Cartera */}
      {tab === 'cartera' && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Fecha Ing.</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Librador</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Banco</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Nro. Cheque</th>
                  <th className="text-right px-4 py-3 font-semibold text-surface-600">Importe</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Vto.</th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600">Días</th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {cartera.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-surface-400">No hay cheques en cartera</td></tr>
                ) : (
                  cartera.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 text-surface-600">{c.fecha_ingreso}</td>
                      <td className="px-4 py-3 font-medium text-surface-800">{c.librador}</td>
                      <td className="px-4 py-3 text-surface-600">{c.banco}</td>
                      <td className="px-4 py-3 text-surface-600">{c.numero_cheque}</td>
                      <td className="px-4 py-3 text-right font-semibold text-surface-800">{formatCurrency(c.importe)}</td>
                      <td className="px-4 py-3 text-surface-600">{c.fecha_vto}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${diasColor(c.dias_para_vencimiento)}`}>
                          <Clock size={12} />
                          {c.dias_para_vencimiento}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEstadoModal(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
                          id={`btn-estado-${c.id}`}
                        >
                          <ArrowRight size={14} />
                          Cambiar Estado
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Emitidos */}
      {tab === 'emitidos' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowEmitidoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all"
              id="btn-nuevo-emitido">
              <Plus size={16} />
              Nuevo Cheque Emitido
            </button>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-surface-600">Fecha Em.</th>
                    <th className="text-left px-4 py-3 font-semibold text-surface-600">Destino</th>
                    <th className="text-left px-4 py-3 font-semibold text-surface-600">Nro. Cheque</th>
                    <th className="text-left px-4 py-3 font-semibold text-surface-600">Vto.</th>
                    <th className="text-right px-4 py-3 font-semibold text-surface-600">Importe</th>
                    <th className="text-center px-4 py-3 font-semibold text-surface-600">Estado</th>
                    <th className="text-center px-4 py-3 font-semibold text-surface-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {emitidos.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-surface-400">No hay cheques emitidos</td></tr>
                  ) : (
                    emitidos.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 text-surface-600">{c.fecha_emision}</td>
                        <td className="px-4 py-3 font-medium text-surface-800">{c.destino}</td>
                        <td className="px-4 py-3 text-surface-600">{c.numero_cheque}</td>
                        <td className="px-4 py-3 text-surface-600">{c.fecha_vto}</td>
                        <td className="px-4 py-3 text-right font-semibold text-surface-800">{formatCurrency(c.importe)}</td>
                        <td className="px-4 py-3 text-center">
                          {c.pagado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} /> Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              <AlertTriangle size={12} /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleMarcarPagado(c.id, !c.pagado)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              c.pagado
                                ? 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {c.pagado ? 'Desmarcar' : 'Marcar Pagado'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Cambiar Estado Cheque */}
      <Modal isOpen={showEstadoModal} onClose={() => setShowEstadoModal(false)} title={`Cheque #${selectedCheque?.numero_cheque}`}>
        <form onSubmit={handleCambiarEstado} className="space-y-4">
          {selectedCheque && (
            <div className="bg-surface-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-surface-500">Librador:</span><span className="font-medium">{selectedCheque.librador}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Importe:</span><span className="font-semibold">{formatCurrency(selectedCheque.importe)}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Vencimiento:</span><span>{selectedCheque.fecha_vto}</span></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nuevo estado</label>
            <select value={estadoForm.nuevo_estado} onChange={(e) => setEstadoForm({...estadoForm, nuevo_estado: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="Depositado">Depositar en banco</option>
              <option value="Entregado a Tercero">Entregar a tercero</option>
            </select>
          </div>

          {estadoForm.nuevo_estado === 'Depositado' && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-800 mb-1">Banco destino</label>
              <select value={estadoForm.banco_destino} onChange={(e) => setEstadoForm({...estadoForm, banco_destino: e.target.value})}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="BNA">BNA</option>
                <option value="BBVA">BBVA</option>
              </select>
              <p className="text-xs text-blue-600 mt-2">Se registrará un ingreso automático en Caja Diaria</p>
            </div>
          )}

          {estadoForm.nuevo_estado === 'Entregado a Tercero' && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Destinatario</label>
                <input type="text" value={estadoForm.destino_nombre} onChange={(e) => setEstadoForm({...estadoForm, destino_nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nombre del destinatario" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Categoría de Caja</label>
                <select value={estadoForm.categoria_caja} onChange={(e) => setEstadoForm({...estadoForm, categoria_caja: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {CATEGORIAS_DESTINO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <p className="text-xs text-amber-600">Se registrará un egreso automático en Caja Diaria</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEstadoModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98]">Confirmar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Cheque Emitido */}
      <Modal isOpen={showEmitidoModal} onClose={() => setShowEmitidoModal(false)} title="Nuevo Cheque Emitido">
        <form onSubmit={handleCrearEmitido} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha Emisión</label>
              <input type="date" value={emitidoForm.fecha_emision} onChange={(e) => setEmitidoForm({...emitidoForm, fecha_emision: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Nro. Cheque</label>
              <input type="text" value={emitidoForm.numero_cheque} onChange={(e) => setEmitidoForm({...emitidoForm, numero_cheque: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Destino</label>
            <input type="text" value={emitidoForm.destino} onChange={(e) => setEmitidoForm({...emitidoForm, destino: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="A quién se le emite" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={emitidoForm.fecha_vto} onChange={(e) => setEmitidoForm({...emitidoForm, fecha_vto: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Importe</label>
              <input type="number" step="0.01" value={emitidoForm.importe} onChange={(e) => setEmitidoForm({...emitidoForm, importe: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEmitidoModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98]">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
