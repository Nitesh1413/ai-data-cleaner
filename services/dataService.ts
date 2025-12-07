import { DataRow, ColumnStats } from '../types';

// --- CSV Utilities ---
export const parseCSV = (text: string): { data: DataRow[]; columns: string[] } => {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { data: [], columns: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowStr = lines[i].trim();
    if (!rowStr) continue;
    
    // Basic CSV splitting handling quotes roughly
    const matches = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    // Fallback for simple split if regex fails or simple CSV
    const values = matches.length > 0 ? matches : rowStr.split(',');

    const row: DataRow = {};
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
      // Attempt numeric conversion
      if (val !== '' && !isNaN(Number(val))) {
        row[header] = Number(val);
      } else {
        row[header] = val;
      }
    });
    data.push(row);
  }

  return { data, columns: headers };
};

export const exportToCSV = (data: DataRow[], columns: string[], filename: string) => {
  if (data.length === 0) return;
  const headerRow = columns.join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const val = row[col] === undefined ? '' : row[col];
      const strVal = String(val);
      // Escape quotes
      return strVal.includes(',') ? `"${strVal}"` : strVal;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Stats Utilities ---

const getMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getMode = (values: any[]): any[] => {
  if (values.length === 0) return [];
  const counts: Record<any, number> = {};
  let maxFreq = 0;
  values.forEach(v => {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > maxFreq) maxFreq = counts[key];
  });
  // Return all values that appear maxFreq times
  return Object.keys(counts)
    .filter(k => counts[k] === maxFreq)
    .map(k => !isNaN(Number(k)) ? Number(k) : k)
    .slice(0, 3); // Limit to top 3 modes if multimodal
};

const getStandardDeviation = (values: number[], mean: number) => {
  if (values.length === 0) return 0;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

// Simple Outlier Detection using IQR
const getOutlierCount = (values: number[], q1: number, q3: number): number => {
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    return values.filter(v => v < lowerBound || v > upperBound).length;
};

export const calculateColumnStats = (data: DataRow[], column: string): ColumnStats => {
  const values = data.map(row => row[column]);
  const nonNullValues = values.filter(v => v !== null && v !== '' && v !== undefined);
  const count = values.length;
  const missing = count - nonNullValues.length;
  const unique = new Set(values).size;

  // Determine type based on non-null values
  const isNumeric = nonNullValues.length > 0 && nonNullValues.every(v => typeof v === 'number');

  if (isNumeric) {
    const numericValues = nonNullValues as number[];
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = numericValues.length > 0 ? sum / numericValues.length : 0;
    const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
    const median = getMedian(numericValues);
    const stdDev = getStandardDeviation(numericValues, mean);
    
    // Quartiles
    const sorted = [...numericValues].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
    const q2 = median;
    const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;

    return {
      type: 'Numeric',
      count,
      unique,
      missing,
      mean,
      median,
      min,
      max,
      stdDev,
      quartiles: { q1, q2, q3 }
    };
  } else {
    // Categorical / String
    const stringValues = nonNullValues.map(String);
    return {
      type: 'Categorical',
      count,
      unique,
      missing,
      min: stringValues.length > 0 ? stringValues.sort()[0] : undefined, // Lexicographical min
      max: stringValues.length > 0 ? stringValues.sort()[stringValues.length - 1] : undefined
    };
  }
};

// --- Global Notebook Analysis ---

export interface GlobalAnalysisReport {
    totalRows: number;
    totalCols: number;
    duplicateRows: number;
    columns: Record<string, ColumnAnalysis>;
}
  
export interface ColumnAnalysis {
    name: string;
    missing: number;
    unique: number;
    type: string; // 'Numeric' | 'Categorical' | 'Date' | 'Mixed'
    issues: string[]; // 'Mixed Types', 'Invalid Dates', etc.
    numericStats?: {
      mean: number;
      median: number;
      mode: any[];
      min: number;
      max: number;
      stdDev: number;
      outliers: number;
    };
    dateStats?: {
      min: string;
      max: string;
      invalidCount: number;
    };
}

export const generateGlobalAnalysis = (data: DataRow[], columns: string[]): GlobalAnalysisReport => {
    const totalRows = data.length;
    const totalCols = columns.length;
    
    // 1. Calculate Duplicate Rows
    const seenRows = new Set<string>();
    let duplicateRows = 0;
    data.forEach(row => {
        const rowStr = JSON.stringify(row);
        if (seenRows.has(rowStr)) {
            duplicateRows++;
        } else {
            seenRows.add(rowStr);
        }
    });

    // 2. Analyze Each Column
    const colReports: Record<string, ColumnAnalysis> = {};

    columns.forEach(col => {
        const values = data.map(r => r[col]);
        const nonNull = values.filter(v => v !== null && v !== '' && v !== undefined);
        const missing = values.length - nonNull.length;
        const unique = new Set(values).size;
        
        let type = 'Categorical';
        const issues: string[] = [];
        let numericStats: ColumnAnalysis['numericStats'] | undefined;
        let dateStats: ColumnAnalysis['dateStats'] | undefined;

        // Type Detection Heuristic
        const numCount = nonNull.filter(v => typeof v === 'number').length;
        const strCount = nonNull.filter(v => typeof v === 'string').length;
        const dateCount = nonNull.filter(v => {
             // Basic strict check if string looks like date and parses
             return typeof v === 'string' && !isNaN(Date.parse(v)) && (v.includes('-') || v.includes('/'));
        }).length;

        // --- Logic to determine primary type and issues ---
        if (numCount > 0 && strCount === 0) {
            type = 'Numeric';
        } else if (dateCount > nonNull.length * 0.8) { // If > 80% look like dates
            type = 'Date';
            if (dateCount < nonNull.length) {
                issues.push('Invalid Date Formats Detected');
            }
        } else if (numCount > 0 && strCount > 0) {
            type = 'Mixed';
            issues.push('Mixed Data Types (Numbers & Text)');
        }

        // --- Calculate Specific Stats ---
        if (type === 'Numeric' || (type === 'Mixed' && numCount > 0)) {
            const numericValues = nonNull.filter(v => typeof v === 'number') as number[];
            if (numericValues.length > 0) {
                const sum = numericValues.reduce((a, b) => a + b, 0);
                const mean = sum / numericValues.length;
                const min = Math.min(...numericValues);
                const max = Math.max(...numericValues);
                const median = getMedian(numericValues);
                const stdDev = getStandardDeviation(numericValues, mean);
                
                // Outliers
                const sorted = [...numericValues].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
                const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;
                const outliers = getOutlierCount(numericValues, q1, q3);

                if (outliers > 0) {
                    issues.push(`Potential Outliers (${outliers})`);
                }

                numericStats = {
                    mean,
                    median,
                    mode: getMode(numericValues),
                    min,
                    max,
                    stdDev,
                    outliers
                };
            }
        }

        if (type === 'Date') {
            const dateValues = nonNull
                .map(v => new Date(String(v)))
                .filter(d => !isNaN(d.getTime()))
                .sort((a, b) => a.getTime() - b.getTime());
            
            if (dateValues.length > 0) {
                dateStats = {
                    min: dateValues[0].toISOString().split('T')[0],
                    max: dateValues[dateValues.length - 1].toISOString().split('T')[0],
                    invalidCount: nonNull.length - dateValues.length
                };
            }
        }
        
        // Add mode for categorical if not calculated in numeric
        if (type === 'Categorical') {
             // Simple mode for strings
             // Not storing full stats to save memory, just noting it's categorical
        }

        colReports[col] = {
            name: col,
            missing,
            unique,
            type,
            issues,
            numericStats,
            dateStats
        };
    });

    return {
        totalRows,
        totalCols,
        duplicateRows,
        columns: colReports
    };
};

export const generateSampleData = () => {
  const columns = ['ID', 'Date', 'Product', 'Category', 'Sales', 'Profit', 'Region'];
  const data: DataRow[] = [];
  const categories = ['Electronics', 'Furniture', 'Office Supplies'];
  const regions = ['North', 'South', 'East', 'West'];
  const products = ['Laptop', 'Chair', 'Desk', 'Monitor', 'Phone', 'Paper'];

  for (let i = 1; i <= 50; i++) {
    data.push({
      ID: i,
      Date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      Product: products[Math.floor(Math.random() * products.length)],
      Category: categories[Math.floor(Math.random() * categories.length)],
      Sales: Math.floor(Math.random() * 1000) + 50,
      Profit: Math.floor(Math.random() * 300) - 50,
      Region: regions[Math.floor(Math.random() * regions.length)],
    });
  }
  return { data, columns };
};