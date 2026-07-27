# `predictor/ml` — Training pipeline

- `train_model.py` — end-to-end pipeline: load UCI dataset → clean → grade-bin
  `quality` → `train_test_split` → `StandardScaler` → `RandomForestClassifier`
  (200 trees, `max_depth=12`, `class_weight='balanced'`) → save
  `wine_model.pkl` + `model_meta.json`.
- `wine_model.pkl` — pickled `sklearn.pipeline.Pipeline`. Loaded once at Django
  startup and used by `predictor/views.py`.
- `model_meta.json` — accuracy, CV mean/std, feature importances, dataset
  stats. Consumed by Home & Dashboard.

To retrain:

```bash
python predictor/ml/train_model.py
```

The React port under `../../../src/` uses the **same** pickle, exported to
`../../../public/wine_model.json` so browser inference matches Django.
