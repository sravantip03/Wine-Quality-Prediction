import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listPredictions, type WinePrediction } from "../lib/wine-history";
import meta from "../../public/model_meta.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VinoAI — Predict Red Wine Quality with Machine Learning" },
      {
        name: "description",
        content:
          "VinoAI uses a Random Forest trained on the UCI Red Wine dataset to grade wines from 11 chemistry inputs. Try live predictions in your browser.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [recent, setRecent] = useState<WinePrediction[]>([]);
  useEffect(() => {
    const load = () => setRecent(listPredictions().slice(0, 5));
    load();
    window.addEventListener("vinoai:history", load);
    return () => window.removeEventListener("vinoai:history", load);
  }, []);

  const accPct = (meta.accuracy * 100).toFixed(1);
  const cvPct = (meta.cv_mean * 100).toFixed(1);

  return (
    <div className="container">
      <section style={{ padding: "3rem 0" }}>
        <span className="badge">🍇 Machine Learning · Random Forest</span>
        <h1
          className="serif"
          style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", lineHeight: 1.1, marginTop: "1rem" }}
        >
          Grade Every{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--wine-light), var(--gold))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bottle
          </span>{" "}
          Before You Uncork It
        </h1>
        <p
          style={{
            color: "var(--text2)",
            fontSize: "1.1rem",
            maxWidth: 620,
            marginTop: "1rem",
            lineHeight: 1.7,
          }}
        >
          VinoAI runs a 200-tree Random Forest trained on the UCI Red Wine Quality dataset to
          predict wine grade from 11 physicochemical measurements — right in your browser.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
          <Link to="/predict" className="btn btn-gold">
            🍷 Predict Wine Quality
          </Link>
          <Link to="/dashboard" className="btn btn-ghost">
            View Dashboard
          </Link>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        <div className="stat">
          <div className="stat-label">Model Accuracy</div>
          <div className="stat-value">{accPct}%</div>
        </div>
        <div className="stat">
          <div className="stat-label">5-Fold CV Mean</div>
          <div className="stat-value">{cvPct}%</div>
        </div>
        <div className="stat">
          <div className="stat-label">Training Samples</div>
          <div className="stat-value">{meta.dataset_stats.total_samples}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Your Predictions</div>
          <div className="stat-value">{recent.length ? listPredictions().length : 0}</div>
        </div>
      </section>

      <section style={{ marginTop: "2.5rem" }}>
        <h2 className="serif" style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
          Recent Predictions
        </h2>
        <div className="card">
          {recent.length === 0 ? (
            <p style={{ color: "var(--text3)" }}>
              No predictions yet. Head to the{" "}
              <Link to="/predict" style={{ color: "var(--gold)" }}>
                Predict page
              </Link>{" "}
              to try one.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Wine</th>
                  <th>Grade</th>
                  <th>Confidence</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: "var(--text)" }}>{p.wine_name}</td>
                    <td style={{ color: "var(--gold)" }}>{p.predicted_grade}</td>
                    <td>{p.confidence.toFixed(1)}%</td>
                    <td style={{ color: "var(--text3)" }}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
