import React, { useMemo } from 'react';
import { DataRow } from '../types';
import { generateGlobalAnalysis } from '../services/dataService';
import { AlertTriangle, CheckCircle, AlertOctagon, Calendar, Hash, Type, Copy } from 'lucide-react';
import { clsx } from 'clsx';

interface GlobalAnalysisViewProps {
  data: DataRow[];
  columns: string[];
  onClose: () => void;
}

export const GlobalAnalysisView: React.FC<GlobalAnalysisViewProps> = ({ data, columns, onClose }) => {
  const report = useMemo(() => generateGlobalAnalysis(data, columns), [data, columns]);
  const columnList = Object.values(report.columns);
  const numericCols = columnList.filter(c => c.numericStats);
  const dateCols = columnList.filter(c => c.dateStats);

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-8 relative">
       {/* Header */}
       <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
           <div>
               <h1 className="text-3xl font-bold text-slate-800">Data Notebook</h1>
               <p className="text-slate-500 mt-1">Comprehensive dataset profiling and quality report</p>
           </div>
           <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">
               Close Notebook
           </button>
       </div>

       <div className="max-w-6xl mx-auto space-y-8">
           {/* KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                        <Hash size={16} /> Dataset Size
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">{report.totalRows}</span>
                        <span className="text-slate-400">rows</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">{report.totalCols} columns</div>
                </div>

                <div className={clsx("bg-white p-6 rounded-xl shadow-sm border", report.duplicateRows > 0 ? "border-red-200 bg-red-50" : "border-slate-200")}>
                    <div className={clsx("text-sm font-medium mb-1 flex items-center gap-2", report.duplicateRows > 0 ? "text-red-600" : "text-slate-500")}>
                        <Copy size={16} /> Duplicates
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={clsx("text-3xl font-bold", report.duplicateRows > 0 ? "text-red-700" : "text-slate-900")}>{report.duplicateRows}</span>
                        <span className={clsx(report.duplicateRows > 0 ? "text-red-600" : "text-slate-400")}>duplicate rows detected</span>
                    </div>
                    <div className="text-sm mt-1 opacity-70">
                        {report.duplicateRows > 0 ? "Action recommended: remove duplicates" : "Dataset is clean of full row duplicates"}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                        <AlertTriangle size={16} /> Data Health Issues
                    </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">
                            {columnList.reduce((acc, col) => acc + col.issues.length, 0)}
                        </span>
                        <span className="text-slate-400">alerts found</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Across {columnList.filter(c => c.issues.length > 0).length} columns</div>
                </div>
           </div>

           {/* Section 1: Data Quality Matrix */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       <Type size={18} className="text-emerald-600"/> Data Quality Matrix
                   </h2>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500 font-medium">
                           <tr>
                               <th className="px-6 py-3">Column Name</th>
                               <th className="px-6 py-3">Inferred Type</th>
                               <th className="px-6 py-3">Missing</th>
                               <th className="px-6 py-3">Unique</th>
                               <th className="px-6 py-3">Quality Issues</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {columnList.map(col => (
                               <tr key={col.name} className="hover:bg-slate-50">
                                   <td className="px-6 py-3 font-medium text-slate-900">{col.name}</td>
                                   <td className="px-6 py-3">
                                       <span className={clsx(
                                           "px-2 py-1 rounded text-xs font-semibold",
                                           col.type === 'Numeric' ? "bg-blue-100 text-blue-700" :
                                           col.type === 'Date' ? "bg-purple-100 text-purple-700" :
                                           col.type === 'Mixed' ? "bg-orange-100 text-orange-700" :
                                           "bg-slate-100 text-slate-600"
                                       )}>
                                           {col.type}
                                       </span>
                                   </td>
                                   <td className="px-6 py-3">
                                       <div className="flex items-center gap-2">
                                           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                               <div 
                                                 className={clsx("h-full rounded-full", col.missing > 0 ? "bg-amber-400" : "bg-emerald-400")} 
                                                 style={{ width: `${Math.min((col.missing / report.totalRows) * 100, 100)}%` }}
                                               />
                                           </div>
                                           <span className={col.missing > 0 ? "text-amber-600 font-medium" : "text-slate-400"}>{col.missing}</span>
                                       </div>
                                   </td>
                                   <td className="px-6 py-3 text-slate-600">{col.unique}</td>
                                   <td className="px-6 py-3">
                                       {col.issues.length > 0 ? (
                                           <div className="flex flex-wrap gap-1">
                                               {col.issues.map((issue, idx) => (
                                                   <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                       <AlertOctagon size={10} /> {issue}
                                                   </span>
                                               ))}
                                           </div>
                                       ) : (
                                           <span className="text-emerald-600 text-xs flex items-center gap-1">
                                               <CheckCircle size={12} /> OK
                                           </span>
                                       )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>

           {/* Section 2: Statistical Deep Dive (Numeric) */}
           {numericCols.length > 0 && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                       <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Hash size={18} className="text-blue-600"/> Statistical Deep Dive (Numeric)
                       </h2>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-500 font-medium">
                               <tr>
                                   <th className="px-6 py-3">Column</th>
                                   <th className="px-6 py-3">Min</th>
                                   <th className="px-6 py-3">Max</th>
                                   <th className="px-6 py-3">Mean</th>
                                   <th className="px-6 py-3">Median</th>
                                   <th className="px-6 py-3">Mode</th>
                                   <th className="px-6 py-3">StdDev</th>
                                   <th className="px-6 py-3">Outliers</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {numericCols.map(col => {
                                   const s = col.numericStats!;
                                   return (
                                       <tr key={col.name} className="hover:bg-slate-50">
                                           <td className="px-6 py-3 font-medium text-slate-900">{col.name}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.min.toLocaleString()}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.max.toLocaleString()}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.mean.toFixed(2)}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.median.toLocaleString()}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.mode.join(', ') || '-'}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.stdDev.toFixed(2)}</td>
                                           <td className="px-6 py-3">
                                               {s.outliers > 0 ? (
                                                   <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">{s.outliers}</span>
                                               ) : (
                                                   <span className="text-slate-400">0</span>
                                               )}
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}

           {/* Section 3: Temporal Analysis */}
           {dateCols.length > 0 && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                       <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                           <Calendar size={18} className="text-purple-600"/> Temporal Analysis (Dates)
                       </h2>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-500 font-medium">
                               <tr>
                                   <th className="px-6 py-3">Column</th>
                                   <th className="px-6 py-3">Earliest Date (Min)</th>
                                   <th className="px-6 py-3">Latest Date (Max)</th>
                                   <th className="px-6 py-3">Format Status</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {dateCols.map(col => {
                                   const s = col.dateStats!;
                                   return (
                                       <tr key={col.name} className="hover:bg-slate-50">
                                           <td className="px-6 py-3 font-medium text-slate-900">{col.name}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.min}</td>
                                           <td className="px-6 py-3 text-slate-600">{s.max}</td>
                                           <td className="px-6 py-3">
                                               {s.invalidCount > 0 ? (
                                                   <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">
                                                       {s.invalidCount} invalid formats
                                                   </span>
                                               ) : (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs">
                                                        Consistent
                                                    </span>
                                               )}
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};