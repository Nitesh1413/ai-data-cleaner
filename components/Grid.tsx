import React from 'react';
import { DataRow } from '../types';
import { clsx } from 'clsx';

interface GridProps {
  data: DataRow[];
  columns: string[];
  selectedColumn: string | null;
  onColumnClick: (col: string) => void;
  onCellEdit: (rowIndex: number, col: string, value: string | number) => void;
}

export const Grid: React.FC<GridProps> = ({ data, columns, selectedColumn, onColumnClick, onCellEdit }) => {
  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      <table className="w-full border-collapse text-sm text-left">
        <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="p-0 sticky left-0 z-20 bg-slate-100 border-b border-r border-slate-300 w-12 text-center text-slate-400 font-normal select-none">
              #
            </th>
            {columns.map((col) => (
              <th 
                key={col}
                onClick={() => onColumnClick(col)}
                className={clsx(
                  "px-4 py-2 font-semibold border-b border-r border-slate-300 cursor-pointer transition-colors select-none whitespace-nowrap min-w-[150px]",
                  selectedColumn === col ? "bg-emerald-100 text-emerald-800 border-b-emerald-300" : "text-slate-600 hover:bg-slate-200"
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.length > 0 ? data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50 group">
              <td className="sticky left-0 bg-slate-50 group-hover:bg-slate-100 border-b border-r border-slate-200 text-center text-xs text-slate-400 select-none">
                {rowIndex + 1}
              </td>
              {columns.map((col) => (
                <td 
                  key={`${rowIndex}-${col}`} 
                  className={clsx(
                    "border-b border-r border-slate-200 p-0 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10 relative",
                    selectedColumn === col ? "bg-emerald-50/30" : ""
                  )}
                >
                  <input
                    className={clsx(
                      "w-full h-full px-4 py-2 bg-transparent outline-none truncate",
                      selectedColumn === col ? "text-emerald-900" : "text-slate-700"
                    )}
                    value={row[col] ?? ''}
                    onChange={(e) => onCellEdit(rowIndex, col, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-20 text-slate-400">
                No data available. Import a file or paste data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};