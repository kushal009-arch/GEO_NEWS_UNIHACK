export type NewsCategory =
  | "Just In"
  | "For You"
  | "Geopolitics"
  | "Business"
  | "Technology"
  | "Climate";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  soWhat: string;
  personalizedImpact?: string;
  source: string;
  url: string;
  category: NewsCategory;
  lat: number;
  lng: number;
  timestamp: string;
  importance: number; // 1-5
  sentiment: "Positive" | "Neutral" | "Negative" | "Anxious" | "Panic" | "Celebratory";
}

export interface TrendAnalysis {
  trend: string;
  prediction: string;
  impact: string;
  confidence: number;
}

export interface UserInterest {
  id: string;
  name: string;
  type: "Supply Chain" | "Investment" | "Travel Route" | "Energy" | "Shipping";
  lat: number;
  lng: number;
  radius: number;
  coords?: [number, number][];
}
