import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GRADE_LABELS, GRADE_COLORS } from "../lib/wine-features";
import { listPredictions } from "../lib/wine-history";
import meta from "../../public/model_meta.json";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VinoAI Model Insights" },
      {
        name: "description",
        content:
          "Model metrics, feature importances, dataset composition, and per-grade prediction stats for the VinoAI Random Forest.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((n) => n + 1);
    window.addEventListener("vinoai:history", h);
    return () => window.removeEventListener("vinoai:history", h);
  }, []);
  const preds = listPredictions();
  void tick;

  const total = preds.length;
  const gradeDist: Record<string, number> = {};
  const confByGrade: Record<string, number> = {};
  GRADE_LABELS.forEach((g) => {
    const filt = preds.filter((p) => p.predicted_grade === g);
    gradeDist[g] = filt.length;
    confByGrade[g] = filt.length
      ? filt.reduce((s, p) => s + p.confidence, 0) / filt.length
      : 0;
  });

  const feats = Object.entries(meta.feature_importances).sort((a, b) => b[1] - a[1]);
  const maxImp = feats[0]?.[1] ?? 1;

  const params: [string, string, string][] = [
    ["algorithm", "RandomForestClassifier", "Ensemble of 200 decision trees"],
    ["n_estimators", "200", "Number of decision trees in the forest"],
    ["max_depth", "12", "Maximum depth of each tree"],
    ["min_samples_split", "4", "Minimum samples required to split a node"],
    ["min_samples_leaf", "2", "Minimum samples required at a leaf node"],
    ["class_weight", "balanced", "Adjusts weights inversely proportional to class frequencies"],
    ["scaler", "StandardScaler", "Zero mean, unit variance normalisation"],
    ["cv_folds", "5", "Number of cross-validation folds"],
    ["test_size", "20%", "Fraction of data held out for testing"],
  ];

  return (
    <div className="container">
      <h1 className="serif" style={{ fontSize: "2.4rem" }}>
        Model Dashboard
      </h1>
      <p style={{ color: "var(--text2)", marginTop: ".5rem" }}>
        Live metrics from the trained model plus your session's prediction stats.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <div className="stat">
          <div className="stat-label">Test Accuracy</div>
          <div className="stat-value">{(meta.accuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="stat">
          <div className="stat-label">CV Mean ± Std</div>
          <div className="stat-value">
            {(meta.cv_mean * 100).toFixed(1)}%
            <span style={{ fontSize: "0.9rem", color: "var(--text3)" }}>
              {" "}
              ±{(meta.cv_std * 100).toFixed(1)}
            </span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Training Samples</div>
          <div className="stat-value">{meta.dataset_stats.total_samples}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Your Predictions</div>
          <div className="stat-value">{total}</div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "2rem" }}>
        <div className="card">
          <h2 className="serif" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
            Feature Importance
          </h2>
          {feats.map(([name, imp]) => (
            <div key={name} style={{ marginBottom: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ textTransform: "capitalize" }}>{name}</span>
                <span style={{ color: "var(--text3)" }}>{(imp * 100).toFixed(1)}%</span>
              </div>
              <div className="bar" style={{ marginTop: 4 }}>
                <span
                  style={{
                    width: `${(imp / maxImp) * 100}%`,
                    background: "linear-gradient(90deg, var(--wine), var(--gold))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="serif" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
            Training Grade Distribution
          </h2>
          {Object.entries(meta.dataset_stats.grade_distribution).map(([g, c], i) => {
            const total = meta.dataset_stats.total_samples;
            const pct = (Number(c) / total) * 100;
            return (
              <div key={g} style={{ marginBottom: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span>{g}</span>
                  <span style={{ color: "var(--text3)" }}>
                    {c} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="bar" style={{ marginTop: 4 }}>
                  <span style={{ width: `${pct}%`, background: GRADE_COLORS[i] }} />
                </div>
              </div>
            );
          })}
          <p style={{ color: "var(--text3)", fontSize: "0.78rem", marginTop: "1rem" }}>
            Note: "Excellent" wines are absent from the UCI red-wine subset, so the model has 4
            active classes.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="serif" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
          Your Predictions by Grade
        </h2>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Count</th>
              <th>Avg Confidence</th>
            </tr>
          </thead>
          <tbody>
            {GRADE_LABELS.map((g, i) => (
              <tr key={g}>
                <td style={{ color: GRADE_COLORS[i] }}>{g}</td>
                <td>{gradeDist[g]}</td>
                <td>{confByGrade[g] ? confByGrade[g].toFixed(1) + "%" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="serif" style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>
          Model Configuration
        </h2>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map(([k, v, d]) => (
              <tr key={k}>
                <td style={{ color: "var(--gold)" }}>{k}</td>
                <td>{v}</td>
                <td style={{ color: "var(--text2)" }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
