import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FEATURES } from "../lib/wine-features";
import { loadWineModel, predict, type WineModel } from "../lib/wine-model";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API — VinoAI" },
      {
        name: "description",
        content: "Programmatic wine-quality predictions via the /api/predict server route.",
      },
    ],
  }),
  component: ApiPage,
});

const sampleBody = JSON.stringify(
  Object.fromEntries(FEATURES.map((f) => [f.name, f.default])),
  null,
  2,
);

function ApiPage() {
  const [model, setModel] = useState<WineModel | null>(null);
  const [body, setBody] = useState(sampleBody);
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    loadWineModel().then(setModel).catch(() => {});
  }, []);

  const run = () => {
    if (!model) return;
    try {
      const parsed = JSON.parse(body);
      const values = FEATURES.map((f) => Number(parsed[f.name]));
      if (values.some((v) => Number.isNaN(v))) throw new Error("Missing/invalid feature values");
      const { classIndex, proba } = predict(model, values);
      setResponse(
        JSON.stringify(
          { predicted_class_index: classIndex, probabilities: proba },
          null,
          2,
        ),
      );
    } catch (e) {
      setResponse("Error: " + (e as Error).message);
    }
  };

  return (
    <div className="container">
      <h1 className="serif" style={{ fontSize: "2.4rem" }}>
        API
      </h1>
      <p style={{ color: "var(--text2)", marginTop: ".5rem" }}>
        In the original Django project the API lives at{" "}
        <code style={{ color: "var(--gold)" }}>POST /api/predict</code>. In the Lovable preview
        the same trained model is invoked client-side — try it below.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
        <div className="card">
          <h2 className="serif" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Request
          </h2>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{
              width: "100%",
              minHeight: 320,
              background: "var(--bg3)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.8rem",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
              fontSize: "0.82rem",
            }}
          />
          <button className="btn btn-gold" style={{ marginTop: "1rem" }} onClick={run} disabled={!model}>
            Send
          </button>
        </div>
        <div className="card">
          <h2 className="serif" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            Response
          </h2>
          <pre
            style={{
              background: "var(--bg3)",
              padding: "0.8rem",
              borderRadius: 8,
              minHeight: 320,
              fontSize: "0.82rem",
              color: "var(--text2)",
              overflow: "auto",
            }}
          >
            {response || "// press Send to run"}
          </pre>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="serif" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          Django equivalent (local)
        </h2>
        <pre style={{ background: "var(--bg3)", padding: "1rem", borderRadius: 8, fontSize: "0.82rem", overflow: "auto" }}>
{`curl -X POST http://127.0.0.1:8000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '${sampleBody.replace(/\n/g, "")}'`}
          </pre>
      </div>
    </div>
  );
}
