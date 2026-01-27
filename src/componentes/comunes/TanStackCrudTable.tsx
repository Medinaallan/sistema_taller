import { useState } from 'react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { Button } from './UI';


interface TanStackCrudTableProps<T extends { id: string }> {
  columns: ColumnDef<T, any>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  editLabel?: string; // texto para el botón editar
  showDelete?: boolean; // mostrar botón eliminar
}

function exportToCSV<T>(data: T[], columns: ColumnDef<T, any>[], filename = 'export.csv') {
  // Extraer headers y accessorKeys
  const headers: string[] = columns.map(col => {
    if (typeof col.header === 'string') return col.header;
    if (typeof col.header === 'function') return '';
    return '';
  });
  // Extraer accessorKeys de las columnas
  const accessorKeys = columns.map(col => {
    // @ts-expect-error: accessorKey puede estar presente
    return (col.accessorKey as string | undefined) ?? '';
  });
  const rows = data.map(row =>
    accessorKeys.map(key => (key ? (row as any)[key] : ''))
  );
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TanStackCrudTable<T extends { id: string }>({ columns, data, onEdit, onDelete, editLabel, showDelete = true }: TanStackCrudTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  });


  // Exportación CSV
  const handleExport = () => {
    exportToCSV(table.getFilteredRowModel().rows.map(r => r.original), columns);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <input
          className="input-field w-full md:w-64"
          placeholder="Buscar..."
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
        />
        <Button size="sm" variant="outline" onClick={handleExport}>Exportar CSV</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' ▲'}
                    {header.column.getIsSorted() === 'desc' && ' ▼'}
                  </th>
                ))}
                {(onEdit || (onDelete && showDelete)) && <th className="px-6 py-3">Acciones</th>}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {(onEdit || (onDelete && showDelete)) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    {onEdit && <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>{editLabel || 'Editar'}</Button>}
                    {onDelete && showDelete && <Button size="sm" variant="danger" onClick={() => onDelete(row.original)}>Eliminar</Button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginación */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-gray-600">
          Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
          de {table.getFilteredRowModel().rows.length}
        </div>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>&laquo;</Button>
          <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>&lsaquo;</Button>
          <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>&rsaquo;</Button>
          <Button size="sm" variant="outline" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>&raquo;</Button>
        </div>
      </div>
    </div>
  );
}
