
interface CrudTableProps<T> {
  columns: { key: keyof T; label: string }[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function CrudTable<T extends { id: string }>({ columns, data, onEdit, onDelete }: CrudTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-6 py-3">Acciones</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {String(item[col.key])}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                  {onEdit && <button className="text-blue-600 hover:underline" onClick={() => onEdit(item)}>Editar</button>}
                  {onDelete && <button className="text-red-600 hover:underline" onClick={() => onDelete(item)}>Eliminar</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
