import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_ANALYSIS, GEMINI_MODEL_CODE } from '../constants';
import { ColumnStats, DataRow } from '../types';

// Initialize with the specific provided API key
const ai = new GoogleGenAI({ apiKey: '5eea3cd708f74f3e94e4885c7a611f4f' });

// 1. Passive Analysis: Explain the column statistics
export const getColumnInsights = async (columnName: string, stats: ColumnStats, sampleValues: any[]): Promise<string> => {
  const prompt = `
    Analyze this column data from a spreadsheet.
    Column Name: "${columnName}"
    Statistics: ${JSON.stringify(stats)}
    Sample Values: ${JSON.stringify(sampleValues.slice(0, 10))}

    Provide a concise (max 3 sentences) summary of the data quality, potential outliers, and what this data likely represents semantically. 
    Do not use markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_ANALYSIS,
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Could not generate insights at this time.";
  }
};

// 2. Active Automation: Generate JavaScript code to transform data
export const generateTransformationCode = async (
  userCommand: string,
  columns: string[],
  sampleData: DataRow[]
): Promise<string> => {
  const prompt = `
    You are a JavaScript expert. I have a dataset variable named 'data', which is an array of objects.
    
    Current Columns: ${JSON.stringify(columns)}
    Sample Row: ${JSON.stringify(sampleData[0])}
    
    User Request: "${userCommand}"
    
    Task: Write the body of a JavaScript function that takes 'data' as an argument and returns the modified data array (or a new array).
    
    Rules:
    1. Use standard JavaScript methods (filter, map, sort, reduce, etc.).
    2. Do NOT use external libraries.
    3. Return ONLY the code for the function body. Do not wrap in markdown or code blocks.
    4. Ensure deep cloning if necessary to avoid mutating the original reference unexpectedly, but returning a new array is preferred.
    5. If sorting, handle types correctly.
    
    Example Output if request is "Filter Sales > 100":
    return data.filter(row => row.Sales > 100);
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_CODE,
      contents: prompt,
    });
    
    let code = response.text || "";
    // Clean up potential markdown code blocks if the model ignores the prompt rules
    code = code.replace(/```javascript/g, '').replace(/```/g, '').trim();
    return code;
  } catch (error) {
    console.error("AI Code Gen Error:", error);
    throw new Error("Failed to generate transformation code.");
  }
};