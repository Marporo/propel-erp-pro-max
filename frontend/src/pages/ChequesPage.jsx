import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import ColumnFilterPopover from '../components/ui/ColumnFilterPopover'
import { applyAdvancedFilters, applyAdvancedSort } from '../utils/tableUtils'
import { Plus, ArrowRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function diffDays(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0,0,0,0)
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24))
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
  
  // Advanced Filter States for both tabs
  const [filtersCartera, setFiltersCartera] = useState({})
  const [sortCartera, setSortCartera] = useState({ key: null, direction: null, dataType: null })
  
  const [filtersEmitidos, setFiltersEmitidos] = useState({})
  const [sortEmitidos, setSortEmitidos] = useState({ key: null, direction: null, dataType: null })

  const handleFilter = (tab, key, config, dataType) => {
    if (tab === 'cartera') setFiltersCartera(prev => ({ ...prev, [key]: { ...config, dataType } }))
    else setFiltersEmitidos(prev => ({ ...prev, [key]: { ...config, dataType } }))
  }
  const handleClear = (tab, key) => {
    if (tab === 'cartera') setFiltersCartera(prev => { const n = {...prev}; delete n[key]; return n })
    else setFiltersEmitidos(prev => { const n = {...prev}; delete n[key]; return n })
  }
  const handleSort = (tab, key, direction, dataType) => {
    if (tab === 'cartera') setSortCartera({ key, direction, dataType })
    else setSortEmitidos({ key, direction, dataType })
  }

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
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-2 py-3 font-semibold text-surface-600">
                    <ColumnFilterPopover columnName="Fecha Ingreso" dataType="date" onApply={(c) => handleFilter('cartera', 'fecha_ingreso', c, 'date')} onClear={() => handleClear('cartera', 'fecha_ingreso')} onSort={(d) => handleSort('cartera', 'fecha_ingreso', d, 'date')} />
                  </th>
                  <th className="text-left px-2 py-3 font-semibold text-surface-600">
                    <ColumnFilterPopover columnName="Librador" dataType="string" onApply={(c) => handleFilter('cartera', 'librador', c, 'string')} onClear={() => handleClear('cartera', 'librador')} onSort={(d) => handleSort('cartera', 'librador', d, 'string')} />
                  </th>
                  <th className="text-left px-2 py-3 font-semibold text-surface-600">
                    <ColumnFilterPopover columnName="Banco" dataType="string" onApply={(c) => handleFilter('cartera', 'banco', c, 'string')} onClear={() => handleClear('cartera', 'banco')} onSort={(d) => handleSort('cartera', 'banco', d, 'string')} />
                  </th>
                  <th className="text-left px-2 py-3 font-semibold text-surface-600">
                    <ColumnFilterPopover columnName="Nro. Cheque" dataType="string" onApply={(c) => handleFilter('cartera', 'numero_cheque', c, 'string')} onClear={() => handleClear('cartera', 'numero_cheque')} onSort={(d) => handleSort('cartera', 'numero_cheque', d, 'string')} />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-surface-600">Importe</th>
                  <th className="text-left px-2 py-3 font-semibold text-surface-600">
                    <ColumnFilterPopover columnName="Vencimiento" dataType="date" onApply={(c) => handleFilter('cartera', 'fecha_vto', c, 'date')} onClear={() => handleClear('cartera', 'fecha_vto')} onSort={(d) => handleSort('cartera', 'fecha_vto', d, 'date')} />
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600">Días</th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {(() => {
                  let result = applyAdvancedFilters(cartera, filtersCartera);
                  result = applyAdvancedSort(result, sortCartera);
                  if (result.length === 0) return <tr><td colSpan={8} className="px-4 py-12 text-center text-surface-400">Sin resultados</td></tr>;
                  
                  return result.map((c) => {
                    const dias = diffDays(c.fecha_vto);
                    return (
                      <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 text-surface-600">{formatDate(c.fecha_ingreso)}</td>
                        <td className="px-4 py-3 font-medium text-surface-800">{c.librador}</td>
                        <td className="px-4 py-3 text-surface-600">{c.banco}</td>
                        <td className="px-4 py-3 text-surface-600">{c.numero_cheque}</td>
                        <td className="px-4 py-3 text-right font-semibold text-surface-800">{formatCurrency(c.importe)}</td>
                        <td className="px-4 py-3 text-surface-600">{formatDate(c.fecha_vto)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${diasColor(dias)}`}>
                            <Clock size={12} />
                            {dias}d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openEstadoModal(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors border border-primary-200 shadow-sm"
                            id={`btn-estado-${c.id}`}
                          >
                            <ArrowRight size={14} />
                            Cambiar Estado
                          </button>
                        </td>
                      </tr>
                    )
                  })
                })()}
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
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    <th className="text-left px-2 py-3 font-semibold text-surface-600">
                      <ColumnFilterPopover columnName="Fecha Emisión" dataType="date" onApply={(c) => handleFilter('emitidos', 'fecha_emision', c, 'date')} onClear={() => handleClear('emitidos', 'fecha_emision')} onSort={(d) => handleSort('emitidos', 'fecha_emision', d, 'date')} />
                    </th>
                    <th className="text-left px-2 py-3 font-semibold text-surface-600">
                      <ColumnFilterPopover columnName="Destino" dataType="string" onApply={(c) => handleFilter('emitidos', 'destino', c, 'string')} onClear={() => handleClear('emitidos', 'destino')} onSort={(d) => handleSort('emitidos', 'destino', d, 'string')} />
                    </th>
                    <th className="text-left px-2 py-3 font-semibold text-surface-600">
                      <ColumnFilterPopover columnName="Nro. Cheque" dataType="string" onApply={(c) => handleFilter('emitidos', 'numero_cheque', c, 'string')} onClear={() => handleClear('emitidos', 'numero_cheque')} onSort={(d) => handleSort('emitidos', 'numero_cheque', d, 'string')} />
                    </th>
                    <th className="text-left px-2 py-3 font-semibold text-surface-600">
                      <ColumnFilterPopover columnName="Vencimiento" dataType="date" onApply={(c) => handleFilter('emitidos', 'fecha_vto', c, 'date')} onClear={() => handleClear('emitidos', 'fecha_vto')} onSort={(d) => handleSort('emitidos', 'fecha_vto', d, 'date')} />
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-surface-600">Importe</th>
                    <th className="text-center px-4 py-3 font-semibold text-surface-600">Estado</th>
                    <th className="text-center px-4 py-3 font-semibold text-surface-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {(() => {
                    let result = applyAdvancedFilters(emitidos, filtersEmitidos);
                    result = applyAdvancedSort(result, sortEmitidos);
                    if (result.length === 0) return <tr><td colSpan={7} className="px-4 py-12 text-center text-surface-400">Sin resultados</td></tr>;
                    
                    return result.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 text-surface-600">{formatDate(c.fecha_emision)}</td>
                        <td className="px-4 py-3 font-medium text-surface-800">{c.destino}</td>
                        <td className="px-4 py-3 text-surface-600">{c.numero_cheque}</td>
                        <td className="px-4 py-3 text-surface-600">{formatDate(c.fecha_vto)}</td>
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-sm ${
                              c.pagado
                                ? 'bg-surface-100 text-surface-500 hover:bg-surface-200 border-surface-200'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                            }`}
                          >
                            {c.pagado ? 'Desmarcar' : 'Marcar Pagado'}
                          </button>
                        </td>
                      </tr>
                    ))
                  })()}
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
              <div className="flex justify-between"><span className="text-surface-500">Vencimiento:</span><span>{formatDate(selectedCheque.fecha_vto)}</span></div>
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
              <input type="number" step="0.01" min="0" value={emitidoForm.importe} onChange={(e) => setEmitidoForm({...emitidoForm, importe: e.target.value})}
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
