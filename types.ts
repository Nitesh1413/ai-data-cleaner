export type DataRow = Record<string, string | number | any>;

export interface ColumnStats {
  type: string;
  count: number;
  unique: number;
  missing: number;
  mean?: number;
  median?: number;
  min?: number | string;
  max?: number | string;
  stdDev?: number;
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface AnalysisResult {
  stats: ColumnStats;
  aiInsights: string;
  loading: boolean;
}
