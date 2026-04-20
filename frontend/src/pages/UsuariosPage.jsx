import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, User, Shield, ShieldAlert, Edit, Save, X, Ban, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import ColumnFilterPopover from '../components/ui/ColumnFilterPopover';
import Modal from '../components/ui/Modal';
import { applyAdvancedFilters, applyAdvancedSort } from '../utils/tableUtils';

export default function UsuariosPage() {
  const { user } = useAuth();
  
  // Si no es admin, no renderizar
  if (user?.rol !== 'admin') {
    return <div className="p-8 text-center text-surface-500">Acceso denegado. Se requiere nivel de administrador.</div>;
  }

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Filtros de Columna
  const [columnFilters, setColumnFilters] = useState({
    nombre_completo: null,
    username: null,
    rol: null,
    activo: null
  });
  const [columnSort, setColumnSort] = useState({ key: null, direction: null });

  // Estados Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Formulario Nuevo/Edición
  const [formData, setFormData] = useState({
    username: '',
    nombre_completo: '',
    rol: 'operador',
    password: 'Propel2024!', // Contraseña por defecto
    activo: true
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/usuarios/');
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar la lista de usuarios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Handlers Modales
  const handleOpenCreate = () => {
    setFormData({ username: '', nombre_completo: '', rol: 'operador', password: 'Propel2024!', activo: true });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (usuario) => {
    setSelectedUser(usuario);
    setFormData({
      username: usuario.username,
      nombre_completo: usuario.nombre_completo || '',
      rol: usuario.rol,
      password: '', // Vacío para no cambiar a menos que se escriba
      activo: usuario.activo
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e, isEdit = false) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // En edición, si el password está vacío, no lo enviamos
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        delete payload.username; // No se puede editar el username

        await api.put(`/usuarios/${selectedUser.id}`, payload);
        setShowEditModal(false);
      } else {
        await api.post('/usuarios/', formData);
        setShowCreateModal(false);
      }
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar el usuario');
    }
  };

  // --- Lógica de Filtros y Ordenamiento ---
  const handleFilterApply = (columnId, filterConfig) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: filterConfig }));
  };

  const handleFilterClear = (columnId) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: null }));
  };

  const handleSort = (columnId, direction) => {
    setColumnSort({ key: columnId, direction });
  };

  // 1. Filtrar
  const filteredData = useMemo(() => {
    return applyAdvancedFilters(usuarios, {
      nombre_completo: { config: columnFilters.nombre_completo, dataType: 'string' },
      username: { config: columnFilters.username, dataType: 'string' },
      rol: { config: columnFilters.rol, dataType: 'string' }
    });
  }, [usuarios, columnFilters]);

  // 2. Ordenar
  const sortedData = useMemo(() => {
    return applyAdvancedSort(filteredData, columnSort.key, columnSort.direction, 'string');
  }, [filteredData, columnSort]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-surface-500 text-sm mt-1">
            Administra los accesos y roles del sistema Propel ERP.
          </p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 text-danger-700 rounded-xl border border-danger-100 flex items-center gap-3">
          <ShieldAlert size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <ColumnFilterPopover 
                    columnName="Nombre Completo"
                    dataType="string"
                    onApply={(config) => handleFilterApply('nombre_completo', config)}
                    onClear={() => handleFilterClear('nombre_completo')}
                    onSort={(dir) => handleSort('nombre_completo', dir)}
                  />
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <ColumnFilterPopover 
                    columnName="Usuario (Username)"
                    dataType="string"
                    onApply={(config) => handleFilterApply('username', config)}
                    onClear={() => handleFilterClear('username')}
                    onSort={(dir) => handleSort('username', dir)}
                  />
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  <ColumnFilterPopover 
                    columnName="Rol"
                    dataType="string"
                    onApply={(config) => handleFilterApply('rol', config)}
                    onClear={() => handleFilterClear('rol')}
                    onSort={(dir) => handleSort('rol', dir)}
                  />
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Estado</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">Cargando usuarios...</td></tr>
              ) : sortedData.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-surface-500">No se encontraron usuarios.</td></tr>
              ) : (
                sortedData.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-900">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${u.rol === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'}`}>
                          {u.rol === 'admin' ? <Shield size={14} /> : <User size={14} />}
                        </div>
                        {u.nombre_completo || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-600 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                        u.rol === 'admin' ? 'bg-primary-100 text-primary-800' : 
                        u.rol === 'visor' ? 'bg-surface-100 text-surface-600' : 'bg-success-50 text-success-700'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 text-success-600 bg-success-50 px-2 py-1 rounded-md text-xs font-medium">
                          <CheckCircle2 size={14} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger-600 bg-danger-50 px-2 py-1 rounded-md text-xs font-medium">
                          <Ban size={14} /> Suspendido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Editar usuario"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR USUARIO */}
      <Modal 
        isOpen={showCreateModal || showEditModal} 
        onClose={() => { setShowCreateModal(false); setShowEditModal(false); }} 
        title={showEditModal ? 'Editar Usuario' : 'Nuevo Usuario'} 
        size="md"
      >
        <form onSubmit={(e) => handleSubmit(e, showEditModal)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Nombre de Usuario (Login)</label>
            <input
              type="text"
              required
              disabled={showEditModal} // No se edita el username
              className={`w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 transition-colors ${showEditModal ? 'opacity-60 cursor-not-allowed' : 'hover:bg-surface-100'}`}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
              placeholder="ej. jperez"
            />
            {!showEditModal && <p className="text-[11px] text-surface-400 mt-1">Se usará para iniciar sesión (sin espacios).</p>}
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 hover:bg-surface-100 transition-colors"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
              placeholder="ej. Juan Pérez"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Rol en el Sistema</label>
            <select
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 hover:bg-surface-100 transition-colors"
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
            >
              <option value="operador">Operador (Uso normal, carga datos)</option>
              <option value="visor">Visor (Solo lectura)</option>
              <option value="admin">Administrador (Acceso total)</option>
            </select>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">
              {showEditModal ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 hover:bg-surface-100 transition-colors"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder={showEditModal ? 'Dejar vacío para no cambiar' : 'Propel2024!'}
            />
            {!showEditModal && <p className="text-[11px] text-surface-400 mt-1">Por defecto: Propel2024!</p>}
          </div>

          {/* Estado Activo/Inactivo (Solo en Edición) */}
          {showEditModal && (
            <div className="pt-2 border-t border-surface-100 mt-4 flex items-center justify-between">
              <div>
                <span className="block text-sm font-semibold text-surface-700">Estado de la cuenta</span>
                <span className="text-xs text-surface-500">Si lo desactivas, no podrá entrar al sistema.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
              className="px-4 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
