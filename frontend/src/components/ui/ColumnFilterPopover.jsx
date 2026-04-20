import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10,
  CalendarDays, CalendarCheck, Filter 
} from 'lucide-react';

const OPERADORES_TEXTO = [
  'Contiene', 'Es exactamente', 'No es', 'No contiene', 
  'Empieza por', 'Es uno de', 'Coincide con'
];

const OPERADORES_FECHA = [
  'Es exactamente', 'No es', 'Antes', 'Después', 'Entre'
];

export default function ColumnFilterPopover({ 
  columnName, 
  dataType = 'string', // 'string' | 'date'
  onApply, 
  onClear, 
  onSort 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Valores por defecto según el tipo de dato
  const defaultOp = dataType === 'date' ? 'Es exactamente' : 'Contiene';
  
  // Estados Locales del Filtro
  const [operator, setOperator] = useState(defaultOp);
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState(''); // Solo usado si dataType === 'date' y operador es 'Entre'
  const [activeSort, setActiveSort] = useState(null); // 'asc' o 'desc'

  const popoverRef = useRef(null);
  const input1Ref = useRef(null);

  // Hook para cerrar al hacer clic afuera del Popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Autofocus en el campo principal cuando se abre el popover
  useEffect(() => {
    if (isOpen && input1Ref.current) {
      setTimeout(() => input1Ref.current.focus(), 50);
    }
  }, [isOpen, operator]);

  // Acciones de los botones inferiores
  const handleApply = () => {
    if (onApply) {
      onApply({ operator, value1, value2 });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setOperator(defaultOp);
    setValue1('');
    setValue2('');
    setActiveSort(null);
    if (onClear) onClear();
    setIsOpen(false);
  };

  // Acción de ordenamiento
  const handleSort = (direction) => {
    setActiveSort(direction);
    if (onSort) onSort(direction);
    setIsOpen(false);
  };

  const isBetween = dataType === 'date' && operator === 'Entre';
  const isFilterActive = value1 !== '' || (isBetween && value2 !== '');

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Botón Trigger en el Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-200 transition-colors ${
          isFilterActive ? 'text-primary-700 bg-primary-100' : 'text-surface-700'
        }`}
      >
        <span className="font-semibold text-sm">{columnName}</span>
        <Filter size={14} className={isFilterActive ? 'fill-primary-200 text-primary-700' : 'text-surface-400'} />
      </button>

      {/* Popover Flotante */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-white rounded-xl shadow-modal border border-surface-200 p-4 left-0 origin-top-left flex flex-col gap-4 font-sans text-left">
          
          {/* SECCIÓN 1: ORDENAMIENTO */}
          <div className="flex gap-2 pb-4 border-b border-surface-100">
            <button 
              onClick={() => handleSort('asc')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors shadow-sm ${
                activeSort === 'asc' 
                  ? 'bg-primary-50 border-primary-200 text-primary-700' 
                  : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {dataType === 'date' ? <CalendarDays size={16} /> : <ArrowDownAZ size={16} />}
              <span>{dataType === 'date' ? 'Antiguos' : 'A a Z'}</span>
            </button>
            <button 
              onClick={() => handleSort('desc')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors shadow-sm ${
                activeSort === 'desc' 
                  ? 'bg-primary-50 border-primary-200 text-primary-700' 
                  : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {dataType === 'date' ? <CalendarCheck size={16} /> : <ArrowUpZA size={16} />}
              <span>{dataType === 'date' ? 'Recientes' : 'Z a A'}</span>
            </button>
          </div>

          {/* SECCIÓN 2: CONFIGURACIÓN DEL FILTRO */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-surface-400 uppercase tracking-wider">
              Condición de filtro
            </label>
            
            {/* Operador Dropdown */}
            <select 
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50 hover:bg-surface-100 transition-colors font-medium text-surface-800 cursor-pointer"
            >
              {(dataType === 'date' ? OPERADORES_FECHA : OPERADORES_TEXTO).map(op => (
                <option key={op} value={op} className="font-medium bg-white">
                  {op}
                </option>
              ))}
            </select>

            {/* Campos de Valor Dinámicos */}
            <div className={`flex gap-2 ${isBetween ? 'flex-col' : ''}`}>
              <input
                ref={input1Ref}
                type={dataType === 'date' ? 'date' : 'text'}
                placeholder={dataType === 'date' ? '' : 'Escribí un valor...'}
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white focus:bg-surface-50 transition-colors placeholder:text-surface-400"
              />
              
              {isBetween && (
                <>
                  <span className="text-center text-surface-400 text-sm font-medium -my-1">y</span>
                  <input
                    type="date"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white focus:bg-surface-50 transition-colors"
                  />
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: ACCIONES */}
          <div className="flex justify-between items-center pt-4 border-t border-surface-100 mt-2">
            <button 
              onClick={handleClear}
              className="px-3 py-1.5 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors shadow-sm"
            >
              Borrar
            </button>
            <button 
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
            >
              Aplicar Filtro
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
