export function applyAdvancedFilters(data, filters) {
  if (!data || !filters || Object.keys(filters).length === 0) return data;

  return data.filter(item => {
    // Para cada filtro activo, la fila debe cumplir la condición (AND lógico)
    return Object.entries(filters).every(([key, config]) => {
      if (!config) return true;
      const { operator, value1, value2, dataType } = config;
      
      // Si el filtro está vacío, lo damos por válido
      if (!value1 && operator !== 'Entre') return true;
      if (operator === 'Entre' && !value1 && !value2) return true;

      const cellValue = item[key];

      if (dataType === 'string') {
        const safeCell = (cellValue || '').toString().toLowerCase();
        const safeVal1 = (value1 || '').toLowerCase();

        switch (operator) {
          case 'Contiene': return safeCell.includes(safeVal1);
          case 'Es exactamente': return safeCell === safeVal1;
          case 'No es': return safeCell !== safeVal1;
          case 'No contiene': return !safeCell.includes(safeVal1);
          case 'Empieza por': return safeCell.startsWith(safeVal1);
          case 'Coincide con': return safeCell === safeVal1; // Alias de Es exactamente
          case 'Es uno de': return safeVal1.split(',').map(s => s.trim().toLowerCase()).includes(safeCell);
          default: return true;
        }
      }

      if (dataType === 'date') {
        if (!cellValue) return false;
        
        // Asumiendo que las fechas vienen en formato 'YYYY-MM-DD' local
        const cellDate = new Date(cellValue + 'T00:00:00').getTime();
        const d1 = value1 ? new Date(value1 + 'T00:00:00').getTime() : null;
        const d2 = value2 ? new Date(value2 + 'T00:00:00').getTime() : null;

        switch (operator) {
          case 'Es exactamente': return cellDate === d1;
          case 'No es': return cellDate !== d1;
          case 'Antes': return d1 && cellDate < d1;
          case 'Después': return d1 && cellDate > d1;
          case 'Entre': 
            if (d1 && d2) return cellDate >= d1 && cellDate <= d2;
            if (d1) return cellDate >= d1;
            if (d2) return cellDate <= d2;
            return true;
          default: return true;
        }
      }

      return true;
    });
  });
}

export function applyAdvancedSort(data, sortConfig) {
  if (!data || !sortConfig || !sortConfig.key || !sortConfig.direction) return data;

  const { key, direction, dataType } = sortConfig;
  const sorted = [...data];

  sorted.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    if (dataType === 'string') {
      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (dataType === 'date') {
      const timeA = valA ? new Date(valA + 'T00:00:00').getTime() : 0;
      const timeB = valB ? new Date(valB + 'T00:00:00').getTime() : 0;
      return direction === 'asc' ? timeA - timeB : timeB - timeA;
    }
    
    // Fallback genérico
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}
