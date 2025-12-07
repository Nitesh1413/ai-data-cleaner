import React, { useState, useEffect, useCallback } from 'react';
import { Grid } from './components/Grid';
import { DetailsPanel } from './components/DetailsPanel';
import { CustomizeBar } from './components/CustomizeBar';
import { GlobalAnalysisView } from './components/GlobalAnalysisView';
import { Toolbar } from './components/Toolbar';
import { Button } from './components/ui/Button';
import { parseCSV, exportToCSV, generateSampleData } from './services/dataService';
import { DataRow } from './types';
import { Bot, Table, LayoutTemplate, AlertCircle, NotebookPen, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  // Application State
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'analysis'>('grid');

  // Initialize with sample data
  useEffect(() => {
    const { data: sampleData, columns: sampleCols } = generateSampleData();
    setData(sampleData);
    setColumns(sampleCols);
  }, []);

  // Handle File Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const { data: parsedData, columns: parsedCols } = parseCSV(text);
          setData(parsedData);
          setColumns(parsedCols);
          setSelectedColumn(null);
          setIsDetailsOpen(false);
          setError(null);
          setViewMode('grid'); // Reset to grid on import
        } catch (err) {
          setError("Failed to parse CSV file.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle File Export
  const handleExport = () => {
    exportToCSV(data, columns, 'gem_sheet_export.csv');
  };

  // Handle Data Transformation (The Active AI Part)
  const handleDataUpdate = useCallback((newData: DataRow[]) => {
    setData(newData);
    // If columns changed, update them too
    if (newData.length > 0) {
      const newCols = Object.keys(newData[0]);
      // Simple check if columns changed
      if (JSON.stringify(newCols) !== JSON.stringify(columns)) {
        setColumns(newCols);
      }
    }
  }, [columns]);

  // Handle Column Selection for Passive AI Analysis
  const handleColumnClick = (colName: string) => {
    if (selectedColumn === colName && isDetailsOpen) {
      setIsDetailsOpen(false);
      setSelectedColumn(null);
    } else {
      setSelectedColumn(colName);
      setIsDetailsOpen(true);
    }
  };

  const handleCellEdit = (rowIndex: number, colName: string, value: string | number) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [colName]: value };
    setData(newData);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-slate-900">
      {/* Header / Toolbar Area */}
      <div className="flex-none border-b border-slate-200 bg-white shadow-sm z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
             <Table size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Gem Sheet</h1>
            <p className="text-xs text-slate-500 font-medium">AI-Driven Intelligent Profiler</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button 
                variant={viewMode === 'analysis' ? 'primary' : 'outline'}
                onClick={() => setViewMode(viewMode === 'grid' ? 'analysis' : 'grid')}
                className="gap-2"
            >
                {viewMode === 'analysis' ? <LayoutGrid size={16} /> : <NotebookPen size={16} />}
                {viewMode === 'analysis' ? 'Back to Grid' : 'Data Notebook'}
            </Button>
          </div>
        </div>

        {viewMode === 'grid' && (
            <>
                <Toolbar onImport={handleFileUpload} onExport={handleExport} />
                <CustomizeBar 
                    data={data} 
                    columns={columns} 
                    onUpdateData={handleDataUpdate}
                    onError={(msg) => setError(msg)}
                />
            </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {loading && (
             <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
               <div className="flex items-center gap-2 text-emerald-600 font-semibold animate-pulse">
                 <Bot className="animate-bounce" /> Processing Data...
               </div>
             </div>
        )}
        
        {error && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3 text-red-700 shadow-lg">
               <AlertCircle size={20} />
               <span>{error}</span>
               <button onClick={() => setError(null)} className="ml-auto text-sm font-bold hover:underline">Dismiss</button>
             </div>
        )}

        {viewMode === 'analysis' ? (
            <GlobalAnalysisView data={data} columns={columns} onClose={() => setViewMode('grid')} />
        ) : (
            <>
                {/* Main Grid */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                <Grid 
                    data={data} 
                    columns={columns} 
                    selectedColumn={selectedColumn}
                    onColumnClick={handleColumnClick}
                    onCellEdit={handleCellEdit}
                />
                </div>

                {/* Details Panel (Right Sidebar) */}
                {isDetailsOpen && selectedColumn && (
                <div className="w-96 flex-none border-l border-slate-200 bg-slate-50 shadow-xl overflow-y-auto relative z-10 transition-all">
                    <button 
                    onClick={() => setIsDetailsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                    <LayoutTemplate size={20} />
                    </button>
                    <DetailsPanel 
                    data={data} 
                    column={selectedColumn} 
                    />
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default App;