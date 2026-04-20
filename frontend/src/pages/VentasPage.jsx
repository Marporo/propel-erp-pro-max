import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { Plus, CreditCard, Search } from 'lucide-react'

function formatCurrency(v) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const METODOS_PAGO = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia BNA', label: 'Transferencia BNA' },
  { value: 'Transferencia BBVA', label: 'Transferencia BBVA' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Apps', label: 'Apps' },
]

const estadoBadge = {
  Pagada: 'bg-green-100 text-green-700',
  'Pago Parcial': 'bg-amber-100 text-amber-700',
  Pendiente: 'bg-red-100 text-red-700',
}

export default function VentasPage() {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVentaModal, setShowVentaModal] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [search, setSearch] = useState('')

  // Form states
  const [ventaForm, setVentaForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: '',
    factura_remito: '',
    importe_neto: '',
    lleva_iva: false,
    costo_repuestos: '0',
    observaciones: '',
  })
  const [pagoForm, setPagoForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    metodo_pago: 'Efectivo',
    cheque_banco: '',
    cheque_numero: '',
    cheque_fecha_vto: '',
    cheque_observaciones: '',
  })
  const [nuevoCliente, setNuevoCliente] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [ventasRes, clientesRes] = await Promise.all([
        api.get('/ventas/'),
        api.get('/clientes/'),
      ])
      setVentas(ventasRes.data)
      setClientes(clientesRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCrearVenta = async (e) => {
    e.preventDefault()
    try {
      await api.post('/ventas/', {
        ...ventaForm,
        cliente_id: parseInt(ventaForm.cliente_id),
        importe_neto: parseFloat(ventaForm.importe_neto),
        costo_repuestos: parseFloat(ventaForm.costo_repuestos || '0'),
      })
      toast.success('✓ Venta registrada correctamente')
      setShowVentaModal(false)
      setVentaForm({
        fecha: new Date().toISOString().split('T')[0],
        cliente_id: '',
        factura_remito: '',
        importe_neto: '',
        lleva_iva: false,
        costo_repuestos: '0',
        observaciones: '',
      })
      fetchData()
    } catch (err) { /* error handled by interceptor */ }
  }

  const handleCrearPago = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        venta_id: selectedVenta.id,
        fecha: pagoForm.fecha,
        monto: parseFloat(pagoForm.monto),
        metodo_pago: pagoForm.metodo_pago,
      }
      if (pagoForm.metodo_pago === 'Cheque') {
        payload.cheque_banco = pagoForm.cheque_banco
        payload.cheque_numero = pagoForm.cheque_numero
        payload.cheque_fecha_vto = pagoForm.cheque_fecha_vto
        payload.cheque_observaciones = pagoForm.cheque_observaciones
      }
      await api.post('/pagos-ventas/', payload)
      toast.success('✓ Pago registrado — Caja Diaria actualizada automáticamente')
      setShowPagoModal(false)
      setPagoForm({
        fecha: new Date().toISOString().split('T')[0],
        monto: '',
        metodo_pago: 'Efectivo',
        cheque_banco: '',
        cheque_numero: '',
        cheque_fecha_vto: '',
        cheque_observaciones: '',
      })
      fetchData()
    } catch (err) { /* error handled by interceptor */ }
  }

  const handleCrearCliente = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/clientes/', { nombre: nuevoCliente })
      toast.success('✓ Cliente creado')
      setClientes([...clientes, data])
      setVentaForm({ ...ventaForm, cliente_id: data.id.toString() })
      setShowClienteModal(false)
      setNuevoCliente('')
    } catch (err) { /* error handled by interceptor */ }
  }

  const openPagoModal = (venta) => {
    setSelectedVenta(venta)
    setPagoForm({
      ...pagoForm,
      fecha: new Date().toISOString().split('T')[0],
      monto: venta.saldo_deudor.toString(),
    })
    setShowPagoModal(true)
  }

  const filteredVentas = ventas.filter((v) => {
    const term = search.toLowerCase()
    return (
      !term ||
      v.cliente_nombre?.toLowerCase().includes(term) ||
      v.factura_remito?.toLowerCase().includes(term) ||
      v.estado_pago?.toLowerCase().includes(term)
    )
  })

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
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, factura o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            id="search-ventas"
          />
        </div>
        <button
          onClick={() => setShowVentaModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all"
          id="btn-nueva-venta"
        >
          <Plus size={16} />
          Nueva Venta
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Factura/Remito</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Neto</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">IVA</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Saldo Deudor</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">Estado</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-surface-400">
                    {search ? 'No se encontraron ventas con ese criterio' : 'No hay ventas registradas. ¡Cargá la primera!'}
                  </td>
                </tr>
              ) : (
                filteredVentas.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{formatDate(v.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-surface-800">{v.cliente_nombre}</td>
                    <td className="px-4 py-3 text-surface-600">{v.factura_remito || '—'}</td>
                    <td className="px-4 py-3 text-right text-surface-600">{formatCurrency(v.importe_neto)}</td>
                    <td className="px-4 py-3 text-center">{v.lleva_iva ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-surface-800">{formatCurrency(v.total)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {v.saldo_deudor > 0 ? formatCurrency(v.saldo_deudor) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge[v.estado_pago] || ''}`}>
                        {v.estado_pago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.saldo_deudor > 0 && (
                        <button
                          onClick={() => openPagoModal(v)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                          id={`btn-pago-${v.id}`}
                        >
                          <CreditCard size={14} />
                          Cargar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Venta */}
      <Modal isOpen={showVentaModal} onClose={() => setShowVentaModal(false)} title="Nueva Venta" size="lg">
        <form onSubmit={handleCrearVenta} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha</label>
              <input type="date" value={ventaForm.fecha} onChange={(e) => setVentaForm({...ventaForm, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Cliente</label>
              <div className="flex gap-2">
                <select value={ventaForm.cliente_id} onChange={(e) => setVentaForm({...ventaForm, cliente_id: e.target.value})}
                  className="flex-1 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Seleccionar...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="button" onClick={() => setShowClienteModal(true)}
                  className="px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-600 hover:bg-surface-50">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Factura/Remito</label>
              <input type="text" value={ventaForm.factura_remito} onChange={(e) => setVentaForm({...ventaForm, factura_remito: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: A-0001-00001234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Importe Neto</label>
              <input type="number" step="0.01" value={ventaForm.importe_neto} onChange={(e) => setVentaForm({...ventaForm, importe_neto: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Costo Repuestos</label>
              <input type="number" step="0.01" value={ventaForm.costo_repuestos} onChange={(e) => setVentaForm({...ventaForm, costo_repuestos: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="lleva-iva" checked={ventaForm.lleva_iva} onChange={(e) => setVentaForm({...ventaForm, lleva_iva: e.target.checked})}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="lleva-iva" className="text-sm font-medium text-surface-700">Lleva IVA (21%)</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Observaciones</label>
            <textarea value={ventaForm.observaciones} onChange={(e) => setVentaForm({...ventaForm, observaciones: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2} placeholder="Notas adicionales..." />
          </div>
          {ventaForm.importe_neto && (
            <div className="bg-primary-50 rounded-lg p-3 text-sm">
              <span className="text-primary-700 font-medium">Total estimado: </span>
              <span className="text-primary-800 font-bold">
                {formatCurrency(parseFloat(ventaForm.importe_neto || 0) * (ventaForm.lleva_iva ? 1.21 : 1))}
              </span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowVentaModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98]">
              Guardar Venta
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cargar Pago */}
      <Modal isOpen={showPagoModal} onClose={() => setShowPagoModal(false)} title={`Cargar Pago — ${selectedVenta?.factura_remito || 'Venta #' + selectedVenta?.id}`}>
        <form onSubmit={handleCrearPago} className="space-y-4">
          {selectedVenta && (
            <div className="bg-surface-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Total factura:</span><span className="font-semibold">{formatCurrency(selectedVenta.total)}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Saldo deudor:</span><span className="font-semibold text-red-600">{formatCurrency(selectedVenta.saldo_deudor)}</span></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Fecha</label>
              <input type="date" value={pagoForm.fecha} onChange={(e) => setPagoForm({...pagoForm, fecha: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Monto</label>
              <input type="number" step="0.01" value={pagoForm.monto} onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Método de Pago</label>
            <select value={pagoForm.metodo_pago} onChange={(e) => setPagoForm({...pagoForm, metodo_pago: e.target.value})}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required>
              {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          {pagoForm.metodo_pago === 'Cheque' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Banco del cheque</label>
                <input type="text" value={pagoForm.cheque_banco} onChange={(e) => setPagoForm({...pagoForm, cheque_banco: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Nro. Cheque</label>
                <input type="text" value={pagoForm.cheque_numero} onChange={(e) => setPagoForm({...pagoForm, cheque_numero: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Fecha Vto.</label>
                <input type="date" value={pagoForm.cheque_fecha_vto} onChange={(e) => setPagoForm({...pagoForm, cheque_fecha_vto: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Observaciones</label>
                <input type="text" value={pagoForm.cheque_observaciones} onChange={(e) => setPagoForm({...pagoForm, cheque_observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowPagoModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:scale-[0.98]">
              Registrar Pago
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Cliente (inline) */}
      <Modal isOpen={showClienteModal} onClose={() => setShowClienteModal(false)} title="Nuevo Cliente" size="sm">
        <form onSubmit={handleCrearCliente} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Nombre</label>
            <input type="text" value={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre del cliente" required autoFocus />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowClienteModal(false)}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">
              Cancelar
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              Crear Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
