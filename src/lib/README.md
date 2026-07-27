# `src/lib` — VinoAI ML runtime for the browser

This folder re-implements just enough of the Django ML layer to run **the same
trained model** in the Lovable preview.

| File | Purpose |
| --- | --- |
| `wine-model.ts` | Loads `/wine_model.json` (exported Random Forest) and runs `predict` / `predictProba`. Mirrors sklearn's `Pipeline([StandardScaler, RandomForestClassifier])`. |
| `wine-features.ts` | The 11-feature `FEATURE_INFO` table + grade labels/colors, ported verbatim from `predictor/views.py`. |
| `wine-history.ts` | localStorage-backed replacement for the `WinePrediction` Django model. |

## How the model got here

```bash
# from original_django_project/
python - <<'PY'
import joblib, json
m = joblib.load("predictor/ml/wine_model.pkl")
sc, clf = m.named_steps["scaler"], m.named_steps["clf"]
# Export mean_, scale_, and every tree's (feature, threshold, left, right, value)
# See public/wine_model.json — ~1.8 MB uncompressed, ~415 KB gzipped.
PY
```

The exported JSON preserves the exact splits and leaf class probabilities so
`predict_proba(x)` in TypeScript returns the same numbers as scikit-learn.
