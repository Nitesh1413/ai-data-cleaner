import React, { useEffect, useState, useMemo } from 'react';
import { DataRow, ColumnStats } from '../types';
import { calculateColumnStats } from '../services/dataService';
import { getColumnInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info, BrainCircuit } from 'lucide-react';

interface DetailsPanelProps {
  data: DataRow[];
  column: string;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ data, column }) => {
  const [stats, setStats] = useState<ColumnStats | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Calculate stats whenever data or column changes
  useEffect(() => {
    if (data.length > 0 && column) {
      const computedStats = calculateColumnStats(data, column);
      setStats(computedStats);
      
      // Reset insight
      setInsight('');
      setLoadingInsight(true);

      // Fetch new insight
      const values = data.map(r => r[column]);
      getColumnInsights(column, computedStats, values)
        .then(text => {
          setInsight(text);
          setLoadingInsight(false);
        })
        .catch(() => setLoadingInsight(false));
    }
  }, [data, column]);

  // Prepare chart data (Distribution for numeric, Counts for categorical)
  const chartData = useMemo(() => {
    if (!stats) return [];
    if (stats.type === 'Numeric') {
        // Create histogram buckets roughly
        const values = data.map(r => Number(r[column])).filter(v => !isNaN(v));
        if(values.length === 0) return [];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const bucketCount = 5;
        const bucketSize = range / bucketCount || 1;
        
        const buckets = Array.from({length: bucketCount}, (_, i) => ({
            name: `${Math.round(min + i * bucketSize)}-${Math.round(min + (i+1) * bucketSize)}`,
            count: 0
        }));

        values.forEach(v => {
            const bucketIndex = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
            if (buckets[bucketIndex]) buckets[bucketIndex].count++;
        });
        return buckets;
    } else {
        // Top 5 values
        const counts: Record<string, number> = {};
        data.forEach(r => {
            const val = String(r[column]);
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }
  }, [stats, data, column]);

  if (!stats) return <div className="p-6 text-slate-400">Loading analysis...</div>;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
            {stats.type}
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 break-words">{column}</h2>
        <p className="text-sm text-slate-500 mt-1">Column Analysis</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatBox label="Count" value={stats.count} />
          <StatBox label="Unique" value={stats.unique} />
          <StatBox label="Missing" value={stats.missing} highlight={stats.missing > 0} />
          {stats.type === 'Numeric' && (
            <>
              <StatBox label="Mean" value={stats.mean?.toFixed(2)} />
              <StatBox label="Median" value={stats.median?.toFixed(2)} />
              <StatBox label="Min" value={stats.min} />
              <StatBox label="Max" value={stats.max} />
            </>
          )}
        </div>

        {/* AI Insight Section */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <BrainCircuit size={60} className="text-emerald-900" />
          </div>
          <h3 className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">
            <SparkleIcon /> AI Insight
          </h3>
          <div className="text-sm text-emerald-900/80 leading-relaxed">
            {loadingInsight ? (
               <div className="animate-pulse flex space-x-4">
                 <div className="flex-1 space-y-2 py-1">
                   <div className="h-2 bg-emerald-200 rounded"></div>
                   <div className="h-2 bg-emerald-200 rounded w-3/4"></div>
                 </div>
               </div>
            ) : (
                insight
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Distribution</h4>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f1f5f9'}}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.6 + (index * 0.1)} />
                      ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

const StatBox = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => (
  <div className={`p-3 rounded-lg border ${highlight ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
    <div className={`text-xs font-medium mb-1 ${highlight ? 'text-red-600' : 'text-slate-400'}`}>{label}</div>
    <div className={`text-lg font-semibold truncate ${highlight ? 'text-red-900' : 'text-slate-700'}`}>{value ?? '-'}</div>
  </div>
);

const SparkleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-600">
        <path d="M9.813 15.904L9 18.75L8.187 15.904C7.81702 14.6062 6.79758 13.5936 5.49 13.23L2.75 12.5L5.49 11.77C6.79758 11.4064 7.81702 10.3938 8.187 9.096L9 6.25L9.813 9.096C10.183 10.3938 11.2024 11.4064 12.51 11.77L15.25 12.5L12.51 13.23C11.2024 13.5936 10.183 14.6062 9.813 15.904Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)