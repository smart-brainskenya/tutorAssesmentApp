import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ data, columns, keyExtractor, emptyMessage = 'No data available.' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-sbk-bg-main rounded-xl border border-sbk-slate-200 shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-sbk-bg-alt text-sbk-blue-dark font-bold border-b border-sbk-slate-200">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`px-6 py-4 uppercase tracking-wider text-[11px] ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sbk-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sbk-slate-400 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={keyExtractor(item)} className="hover:bg-blue-50 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} className={`px-6 py-4 ${col.className || ''}`}>
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
