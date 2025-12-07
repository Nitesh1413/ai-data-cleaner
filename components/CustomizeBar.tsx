import React, { useState } from 'react';
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { generateTransformationCode } from '../services/geminiService';
import { DataRow } from '../types';

interface CustomizeBarProps {
  data: DataRow[];
  columns: string[];
  onUpdateData: (newData: DataRow[]) => void;
  onError: (msg: string) => void;
}

export const CustomizeBar: React.FC<CustomizeBarProps> = ({ data, columns, onUpdateData, onError }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    if (data.length === 0) {
      onError("No data to transform.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Get Code from AI
      const code = await generateTransformationCode(prompt, columns, data.slice(0, 5));
      console.log("Generated Code:", code);

      // 2. Execute Code safely (within client context)
      // We create a function that takes 'data' and returns the result
      // eslint-disable-next-line no-new-func
      const transformFunction = new Function('data', code);
      
      const result = transformFunction(data);

      if (Array.isArray(result)) {
        onUpdateData(result);
        setPrompt(''); // Clear prompt on success
      } else {
        throw new Error("The AI transformation did not return a valid array of data.");
      }

    } catch (err: any) {
      console.error(err);
      onError(`Transformation Failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-2 relative">
          <div className="mt-2 text-emerald-600">
             <Sparkles size={20} className={isProcessing ? "animate-pulse" : ""} />
          </div>
          
          <div className="flex-1 relative">
            <div className="relative">
              {isExpanded ? (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI to transform your data (e.g., 'Sort by Sales descending', 'Filter rows where Profit < 0')..."
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 min-h-[80px] p-3 text-sm resize-none pr-12 font-medium"
                />
              ) : (
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AI to transform your data..."
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 h-10 px-3 text-sm pr-12 font-medium"
                />
              )}
              
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute right-2 top-2 text-slate-400 hover:text-emerald-600 p-1"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            <div className="mt-1 text-xs text-slate-400 pl-1">
              Active AI Automation &bull; Changes data immediately
            </div>
          </div>

          <Button 
            onClick={handleExecute} 
            disabled={isProcessing || !prompt.trim()}
            className="mt-0.5"
          >
             {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};