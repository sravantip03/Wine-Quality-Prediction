import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GRADE_LABELS, GRADE_COLORS } from "../lib/wine-features";
import {
  clearAll,
  deletePrediction,
  listPredictions,
  type WinePrediction,
} from "../lib/wine-history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Prediction History — VinoAI" },
      {
        name: "description",
        content:
          "Every prediction you've made this session with wine name, grade, confidence, and full input snapshot.",
      },
    ],
  }),
  component: History,
});

function History() {
  const [preds, setPreds] = useState<WinePrediction[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setPreds(listPredictions());
    load();
    window.addEventListener("vinoai:history", load);
    return () => window.removeEventListener("vinoai:history", load);
  }, []);

  const filtered = filter ? preds.filter((p) => p.predicted_grade === filter) : preds;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="serif" style={{ fontSize: "2.4rem" }}>
            Prediction History
          </h1>
          <p style={{ color: "var(--text2)", marginTop: ".5rem" }}>
            {preds.length} prediction{preds.length === 1 ? "" : "s"} · stored locally in your browser
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "0.6rem 0.9rem",
              background: "var(--bg2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontFamily: "inherit",
            }}
          >
            <option value="">All grades</option>
            {GRADE_LABELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {preds.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (confirm("Clear all predictions?")) clearAll();
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text3)", textAlign: "center", padding: "2rem" }}>
            No predictions to show.{" "}
            <Link to="/predict" style={{ color: "var(--gold)" }}>
              Make one →
            </Link>
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Wine</th>
                <th>Grade</th>
                <th>Quality</th>
                <th>Confidence</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const idx = GRADE_LABELS.indexOf(p.predicted_grade);
                return (
                  <>
                    <tr key={p.id}>
                      <td>{p.wine_name}</td>
                      <td style={{ color: GRADE_COLORS[idx] ?? "var(--gold)" }}>{p.predicted_grade}</td>
                      <td>{p.predicted_quality}/10</td>
                      <td>{p.confidence.toFixed(1)}%</td>
                      <td style={{ color: "var(--text3)" }}>
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
                          onClick={() => setOpen(open === p.id ? null : p.id)}
                        >
                          {open === p.id ? "Hide" : "Details"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{
                            padding: "0.35rem 0.7rem",
                            fontSize: "0.8rem",
                            marginLeft: 6,
                          }}
                          onClick={() => deletePrediction(p.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    {open === p.id && (
                      <tr key={p.id + "-d"}>
                        <td colSpan={6} style={{ background: "var(--bg3)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                              <div className="feat-label" style={{ marginBottom: "0.4rem" }}>
                                Inputs
                              </div>
                              <pre style={{ fontSize: "0.78rem", color: "var(--text2)", whiteSpace: "pre-wrap" }}>
                                {JSON.stringify(p.features, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="feat-label" style={{ marginBottom: "0.4rem" }}>
                                Probabilities
                              </div>
                              {GRADE_LABELS.map((g, i) => (
                                <div key={g} style={{ marginBottom: 4 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                                    <span>{g}</span>
                                    <span style={{ color: "var(--text3)" }}>
                                      {(p.probas[g] ?? 0).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="bar" style={{ marginTop: 2 }}>
                                    <span
                                      style={{ width: `${p.probas[g] ?? 0}%`, background: GRADE_COLORS[i] }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
