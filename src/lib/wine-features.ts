// Ported verbatim from predictor/views.py FEATURE_INFO
export type FeatureKey =
  | "fixed_acidity"
  | "volatile_acidity"
  | "citric_acid"
  | "residual_sugar"
  | "chlorides"
  | "free_sulfur_dioxide"
  | "total_sulfur_dioxide"
  | "density"
  | "ph"
  | "sulphates"
  | "alcohol";

export interface FeatureInfo {
  name: FeatureKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  help: string;
  icon: string;
}

export const FEATURES: FeatureInfo[] = [
  { name: "fixed_acidity", label: "Fixed Acidity", unit: "g/dm³", min: 4, max: 16, step: 0.1, default: 8.3, help: "Most acids in wine (tartaric, malic)", icon: "⚗️" },
  { name: "volatile_acidity", label: "Volatile Acidity", unit: "g/dm³", min: 0.1, max: 1.6, step: 0.01, default: 0.53, help: "Acetic acid level; too high → vinegar taste", icon: "🌡️" },
  { name: "citric_acid", label: "Citric Acid", unit: "g/dm³", min: 0, max: 1, step: 0.01, default: 0.27, help: "Adds freshness and flavor", icon: "🍋" },
  { name: "residual_sugar", label: "Residual Sugar", unit: "g/dm³", min: 1, max: 15, step: 0.1, default: 2.5, help: "Sugar remaining after fermentation", icon: "🍬" },
  { name: "chlorides", label: "Chlorides", unit: "g/dm³", min: 0.01, max: 0.6, step: 0.001, default: 0.087, help: "Salt content in wine", icon: "🧂" },
  { name: "free_sulfur_dioxide", label: "Free Sulfur Dioxide", unit: "mg/dm³", min: 1, max: 72, step: 0.5, default: 15.9, help: "Free form of SO₂; prevents microbial growth", icon: "💨" },
  { name: "total_sulfur_dioxide", label: "Total Sulfur Dioxide", unit: "mg/dm³", min: 6, max: 289, step: 1, default: 46, help: "Total SO₂; preservative in wine", icon: "🧪" },
  { name: "density", label: "Density", unit: "g/cm³", min: 0.99, max: 1.004, step: 0.0001, default: 0.9967, help: "Depends on alcohol & sugar content", icon: "⚖️" },
  { name: "ph", label: "pH", unit: "", min: 2.7, max: 4.1, step: 0.01, default: 3.31, help: "Acidity scale; wines range 2.9–4.0", icon: "🔬" },
  { name: "sulphates", label: "Sulphates", unit: "g/dm³", min: 0.33, max: 2, step: 0.01, default: 0.66, help: "Wine additive; antimicrobial & antioxidant", icon: "🛡️" },
  { name: "alcohol", label: "Alcohol", unit: "% vol", min: 8, max: 15, step: 0.1, default: 10.4, help: "Alcohol percentage by volume", icon: "🍷" },
];

// The trained model has 4 classes (Excellent absent from training data).
export const GRADE_LABELS = ["Poor", "Below Average", "Average", "Good", "Excellent"];
export const GRADE_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
export const GRADE_TO_QUALITY: Record<number, number> = { 0: 3, 1: 5, 2: 6, 3: 7, 4: 9 };
