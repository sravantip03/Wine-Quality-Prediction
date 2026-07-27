# VinoAI — Wine Quality Prediction

VinoAI grades red wine from 11 physicochemical measurements using a **Random
Forest** trained on the UCI Red Wine Quality dataset.

This repository ships **two runnable stacks** side-by-side:

| Stack | Location | Runs in Lovable preview? |
| --- | --- | --- |
| **React + TanStack Start port** (the preview you're seeing) | `src/` | ✅ yes |
| **Original Django project** (source of truth) | `original_django_project/` | ❌ no — requires local Python |

The React port loads the **same trained Random Forest** that Django uses
(exported from `predictor/ml/wine_model.pkl` to `public/wine_model.json`) and
runs the identical StandardScaler + tree-vote math client-side. No dummy
predictions, no shortcuts — every probability comes from the actual 200 trees.

---

## Why two stacks?

Lovable's preview runs on Cloudflare Workers (TanStack Start + React). It has
no Python runtime, so `manage.py runserver` cannot run in the preview. To give
you an interactive VinoAI in Lovable, we exported the trained scikit-learn
pipeline to JSON and re-implemented `.predict()` / `.predict_proba()` in
TypeScript. Numeric outputs match the Django app.

Everything else — the ML training pipeline, the Django models/views/templates,
the SQLite DB, the training script — is preserved under `original_django_project/`
so you can still run the full stack locally.

---

## Features

- 🍷 Interactive prediction form (11 sliders + numeric inputs)
- 🔮 Grade prediction with per-class probabilities (real `predict_proba`)
- 📊 Dashboard with real model metrics, feature importances, training distribution
- 📜 Local prediction history (localStorage in preview; SQLite in Django)
- 🧪 API sandbox in-preview, plus original `POST /api/predict` endpoint locally
- 🎨 Wine/gold dark theme preserved from the original templates

## ML Workflow

```
UCI Red Wine dataset (1,600 samples, 11 features)
        │
        ▼
Clean / bin `quality` into 5 grades (Poor → Excellent)
        │
        ▼
train_test_split (test_size=0.2, stratify=y)
        │
        ▼
StandardScaler  (zero mean, unit variance)
        │
        ▼
RandomForestClassifier(n_estimators=200, max_depth=12,
                       min_samples_split=4, min_samples_leaf=2,
                       class_weight="balanced")
        │
        ▼
predict() + predict_proba()
```

### Model metrics (from `predictor/ml/model_meta.json`)

| Metric | Value |
| --- | --- |
| Test accuracy | **57.5%** |
| 5-fold CV mean | **57.9% ± 1.7%** |
| Training samples | 1,600 |
| Active classes | 4 (Poor · Below Average · Average · Good — no "Excellent" wines in UCI red subset) |

Top features by importance: **alcohol (21.3%)**, **sulphates (13.5%)**,
**volatile acidity (13.8%)**, chlorides, citric acid.

## Technologies

- **Frontend port (Lovable preview):** React 19, TanStack Start, TypeScript, Vite, Tailwind v4
- **Original backend:** Django 5, SQLite, scikit-learn, pandas, numpy, joblib
- **Model:** scikit-learn Pipeline → StandardScaler + RandomForestClassifier

## Project Structure

```
├── src/                          # React port (runs in Lovable)
│   ├── routes/                   # index, predict, dashboard, history, api
│   └── lib/
│       ├── wine-model.ts         # Loads exported RF + runs predict/predict_proba
│       ├── wine-features.ts      # FEATURE_INFO ported from Django
│       └── wine-history.ts       # localStorage-backed WinePrediction store
├── public/
│   ├── wine_model.json           # Exported 200-tree Random Forest (~1.8 MB)
│   └── model_meta.json           # Metrics / feature importances / dataset stats
└── original_django_project/      # Untouched original app
    ├── manage.py
    ├── requirements.txt
    ├── predictor/
    │   ├── models.py             # WinePrediction ORM
    │   ├── views.py              # home, predict, dashboard, history, API
    │   ├── urls.py
    │   ├── templates/predictor/  # base, home, predict, result, dashboard, history
    │   └── ml/
    │       ├── train_model.py    # Full training pipeline
    │       ├── wine_model.pkl    # Trained pipeline (source of the JSON export)
    │       ├── model_meta.json   # Metrics / dataset stats
    │       └── README.md         # ML folder notes
    └── wine_quality_project/     # Django settings/urls/wsgi
```

## Running the React Port (Lovable preview / local Node)

Already running in the Lovable preview. To run locally:

```bash
bun install         # or: npm install
bun dev             # http://localhost:8080
```

## Running the Original Django App Locally

```bash
cd original_django_project

python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# (optional) retrain the model — regenerates wine_model.pkl + model_meta.json
python predictor/ml/train_model.py

python manage.py migrate
python manage.py runserver
# → http://127.0.0.1:8000
```

### Prediction API (Django)

```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"fixed_acidity":8.3,"volatile_acidity":0.53,"citric_acid":0.27,
       "residual_sugar":2.5,"chlorides":0.087,"free_sulfur_dioxide":15.9,
       "total_sulfur_dioxide":46,"density":0.9967,"ph":3.31,
       "sulphates":0.66,"alcohol":10.4}'
```

## Prediction Workflow

1. User enters 11 physicochemical values
2. `StandardScaler.transform(x)` normalises them with the training-time mean/scale
3. 200 decision trees each vote a class probability
4. Probabilities are averaged → argmax = predicted grade, max = confidence
5. Result + inputs are persisted (SQLite in Django, localStorage in the React port)

## Dashboard & History

- **Dashboard** — real model metrics (accuracy, CV), feature importances (bar chart),
  training-grade distribution, your session's per-grade counts & average confidence
- **History** — chronological list of predictions with grade filter, per-row detail
  expansion (inputs + probability breakdown), delete / clear-all

## Future Improvements

- Retrain on the white-wine variant and add a wine-type selector
- Add gradient-boosted comparison (XGBoost / LightGBM) side-by-side
- Deploy the Django API separately and let the React port call it when configured
- Export training-time confusion matrix and plot in the dashboard

## Author

Original VinoAI Django app: **you**.
Lovable-preview React port: generated on top of your existing code, keeping the
ML pipeline identical.
