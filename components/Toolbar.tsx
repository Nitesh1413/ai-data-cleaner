import React from 'react';
import { Button } from './ui/Button';
import { Upload, Download } from 'lucide-react';

interface ToolbarProps {
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onImport, onExport }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100">
      <div className="relative">
        <input 
          type="file" 
          accept=".csv" 
          onChange={onImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
          <Upload size={14} />
          Import CSV
        </Button>
      </div>
      
      <div className="h-4 w-px bg-slate-200 mx-1"></div>

      <Button variant="ghost" size="sm" onClick={onExport} className="gap-2 text-slate-600">
        <Download size={14} />
        Export CSV
      </Button>
    </div>
  );
};