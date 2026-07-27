// localStorage-based replacement for the Django WinePrediction model.
// Same fields as predictor/models.py.
import type { FeatureKey } from "./wine-features";

export interface WinePrediction {
  id: string;
  created_at: string; // ISO
  wine_name: string;
  features: Record<FeatureKey, number>;
  predicted_grade: string;
  predicted_quality: number;
  confidence: number; // 0-100
  probas: Record<string, number>; // grade -> %
}

const KEY = "vinoai_predictions_v1";

function read(): WinePrediction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WinePrediction[]) : [];
  } catch {
    return [];
  }
}

function write(list: WinePrediction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("vinoai:history"));
}

export function listPredictions(): WinePrediction[] {
  return read().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function savePrediction(p: Omit<WinePrediction, "id" | "created_at">): WinePrediction {
  const record: WinePrediction = {
    ...p,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const list = read();
  list.push(record);
  write(list);
  return record;
}

export function deletePrediction(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function clearAll() {
  write([]);
}
