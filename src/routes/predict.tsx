import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FEATURES,
  GRADE_LABELS,
  GRADE_COLORS,
  GRADE_TO_QUALITY,
  type FeatureKey,
} from "../lib/wine-features";
import { loadWineModel, predict, type WineModel } from "../lib/wine-model";
import { savePrediction, type WinePrediction } from "../lib/wine-history";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Wine Quality — VinoAI" },
      {
        name: "description",
        content:
          "Enter 11 wine chemistry values and get a grade, quality score, and per-class probabilities from the trained Random Forest model.",
      },
    ],
  }),
  component: PredictPage,
});

function PredictPage() {
  const [values, setValues] = useState<Record<FeatureKey, number>>(() =>
    Object.fromEntries(FEATURES.map((f) => [f.name, f.default])) as Record<FeatureKey, number>,
  );
  const [wineName, setWineName] = useState("Red Wine");
  const [model, setModel] = useState<WineModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [result, setResult] = useState<WinePrediction | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadWineModel()
      .then((m) => setModel(m))
      .catch((e) => setLoadErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const orderedValues = useMemo(
    () => FEATURES.map((f) => values[f.name]),
    [values],
  );

  const handlePredict = () => {
    if (!model) return;
    setPredicting(true);
    // Wrap so React paints the "predicting" state before the sync compute.
    setTimeout(() => {
      const { classIndex, proba } = predict(model, orderedValues);
      const gradeLabel = GRADE_LABELS[classIndex] ?? `Class ${classIndex}`;
      const qualityVal = GRADE_TO_QUALITY[classIndex] ?? 6;
      const confidence = Math.max(...proba) * 100;
      const probaMap: Record<string, number> = {};
      GRADE_LABELS.forEach((g, i) => {
        probaMap[g] = proba[i] != null ? proba[i] * 100 : 0;
      });
      const saved = savePrediction({
        wine_name: wineName.trim() || "Red Wine",
        features: { ...values },
        predicted_grade: gradeLabel,
        predicted_quality: qualityVal,
        confidence,
        probas: probaMap,
      });
      setResult(saved);
      setPredicting(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 30);
  };

  return (
    <div className="container">
      <h1 className="serif" style={{ fontSize: "2.4rem" }}>
        Predict Wine Quality
      </h1>
      <p style={{ color: "var(--text2)", marginTop: ".5rem" }}>
        The exact trained Random Forest ({model?.trees.length ?? "…"} trees) runs client-side.
      </p>

      {loading && <p style={{ color: "var(--text3)", marginTop: "1rem" }}>Loading model…</p>}
      {loadErr && (
        <p style={{ color: "var(--wine-light)", marginTop: "1rem" }}>Model failed to load: {loadErr}</p>
      )}

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <label className="feat-label">Wine Name</label>
        <input
          type="text"
          value={wineName}
          onChange={(e) => setWineName(e.target.value)}
          style={{
            display: "block",
            marginTop: "0.5rem",
            marginBottom: "1.5rem",
            width: "100%",
            maxWidth: 400,
            padding: "0.7rem 1rem",
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text)",
            fontFamily: "inherit",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.name} className="feat-group">
              <div className="feat-top">
                <span className="feat-label">
                  <span style={{ marginRight: 6 }}>{f.icon}</span>
                  {f.label}
                </span>
                {f.unit && <span className="feat-unit">{f.unit}</span>}
              </div>
              <div className="feat-row">
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.name]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.name]: Number(e.target.value) }))
                  }
                />
                <input
                  className="feat-slider"
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={values[f.name]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.name]: Number(e.target.value) }))
                  }
                />
              </div>
              <p className="feat-help">{f.help}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-gold"
            onClick={handlePredict}
            disabled={!model || predicting}
          >
            {predicting ? "Predicting…" : "🔮 Predict Quality"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() =>
              setValues(
                Object.fromEntries(FEATURES.map((f) => [f.name, f.default])) as Record<
                  FeatureKey,
                  number
                >,
              )
            }
          >
            Reset to defaults
          </button>
        </div>
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: WinePrediction }) {
  const gradeIdx = GRADE_LABELS.indexOf(result.predicted_grade);
  const color = GRADE_COLORS[gradeIdx] ?? "var(--gold)";
  return (
    <div className="card" style={{ marginTop: "1.5rem", borderColor: color }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="feat-label">Prediction</div>
          <h2
            className="serif"
            style={{ fontSize: "2.4rem", color, marginTop: "0.3rem" }}
          >
            {result.predicted_grade}
          </h2>
          <p style={{ color: "var(--text2)" }}>
            {result.wine_name} · Quality score ≈ {result.predicted_quality}/10
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="feat-label">Confidence</div>
          <div
            className="serif"
            style={{ fontSize: "2.4rem", color: "var(--gold)", marginTop: "0.3rem" }}
          >
            {result.confidence.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div className="feat-label" style={{ marginBottom: "0.8rem" }}>
          Class Probabilities
        </div>
        {GRADE_LABELS.map((g, i) => {
          const p = result.probas[g] ?? 0;
          return (
            <div key={g} style={{ marginBottom: "0.7rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span>{g}</span>
                <span style={{ color: "var(--text3)" }}>{p.toFixed(1)}%</span>
              </div>
              <div className="bar" style={{ marginTop: 4 }}>
                <span style={{ width: `${p}%`, background: GRADE_COLORS[i] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
