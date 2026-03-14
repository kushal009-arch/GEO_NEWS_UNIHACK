const BACKEND = 'http://localhost:5001';

export interface RiskIndex {
  id?: number;
  category: string;
  region: string;
  risk_level: number;
  label: string;
  level_label: 'Low' | 'Moderate' | 'High' | 'Severe';
  forecast: string;
  so_what: string;
  created_at?: string;
}

/**
 * Ask the backend to pull the latest 10 news events, send them to Groq,
 * and generate Strategic Risk assessments. Results are saved to the
 * risk_indices and ai_forecasts Supabase tables.
 */
export async function generateRegionalForecasts(): Promise<RiskIndex[]> {
  try {
    const res = await fetch(`${BACKEND}/api/generate-forecasts`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.forecasts as RiskIndex[]) || [];
  } catch (err) {
    console.error('[aiService] generateRegionalForecasts failed:', err);
    return [];
  }
}

/**
 * Read the latest cached risk index per category from Supabase (via backend).
 * Fast - no Groq call. Falls back to empty array on error.
 */
export async function fetchRiskIndices(): Promise<RiskIndex[]> {
  try {
    const res = await fetch(`${BACKEND}/api/risk-indices`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as RiskIndex[];
  } catch (err) {
    console.error('[aiService] fetchRiskIndices failed:', err);
    return [];
  }
}
