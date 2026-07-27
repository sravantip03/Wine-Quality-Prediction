"""
Wine Quality Prediction - Model Training Script
Uses UCI Wine Quality Dataset (Red Wine)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (classification_report, confusion_matrix,
                              accuracy_score, roc_auc_score)
from sklearn.pipeline import Pipeline
import joblib
import json
import os

# ── Download / generate the dataset ─────────────────────────────────────────
def get_dataset():
    """Download wine quality dataset or create a realistic synthetic version."""
    try:
        url = "https://archive.ics.uci.edu/ml/machine-learning-databases/wine-quality/winequality-red.csv"
        df = pd.read_csv(url, sep=';')
        print(f"✅ Downloaded dataset: {len(df)} samples")
        return df
    except Exception:
        print("⚠️  Could not download — generating synthetic dataset …")
        return generate_synthetic_dataset()


def generate_synthetic_dataset(n=1600):
    np.random.seed(42)
    data = {
        'fixed acidity':      np.clip(np.random.normal(8.3,  1.7,  n), 4,  16),
        'volatile acidity':   np.clip(np.random.normal(0.53, 0.18, n), 0.1, 1.6),
        'citric acid':        np.clip(np.random.normal(0.27, 0.19, n), 0,  1),
        'residual sugar':     np.clip(np.random.normal(2.5,  1.4,  n), 1,  15),
        'chlorides':          np.clip(np.random.normal(0.087,0.047,n), 0.01,0.6),
        'free sulfur dioxide':np.clip(np.random.normal(15.9, 10.5, n), 1,  72),
        'total sulfur dioxide':np.clip(np.random.normal(46,  32,   n), 6, 289),
        'density':            np.clip(np.random.normal(0.997,0.002,n), 0.990,1.004),
        'pH':                 np.clip(np.random.normal(3.31, 0.15, n), 2.74, 4.01),
        'sulphates':          np.clip(np.random.normal(0.66, 0.17, n), 0.33, 2.0),
        'alcohol':            np.clip(np.random.normal(10.4, 1.1,  n), 8.4, 14.9),
    }
    df = pd.DataFrame(data)
    # Quality correlated with alcohol & sulphates, inversely with volatile acidity
    score = (
        (df['alcohol'] - 8) * 0.35
        + (df['sulphates'] - 0.4) * 1.2
        - (df['volatile acidity'] - 0.3) * 1.5
        + (df['citric acid']) * 0.8
        + np.random.normal(0, 0.5, n)
    )
    quality = pd.cut(score,
                     bins=[-np.inf, -0.5, 0.5, 1.5, np.inf],
                     labels=[4, 5, 6, 7]).astype(int)
    df['quality'] = quality
    return df


# ── Label mapping ─────────────────────────────────────────────────────────────
def quality_to_grade(q):
    if q <= 4:  return 0   # Poor
    if q <= 5:  return 1   # Below Average
    if q <= 6:  return 2   # Average
    if q <= 7:  return 3   # Good
    return 4                # Excellent


GRADE_LABELS = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']
GRADE_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60']


# ── Train ─────────────────────────────────────────────────────────────────────
def train():
    df = get_dataset()
    df = df.dropna()

    FEATURES = ['fixed acidity', 'volatile acidity', 'citric acid',
                 'residual sugar', 'chlorides', 'free sulfur dioxide',
                 'total sulfur dioxide', 'density', 'pH', 'sulphates', 'alcohol']

    X = df[FEATURES]
    y = df['quality'].apply(quality_to_grade)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf',    RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')

    print(f"\n{'='*55}")
    print(f"  MODEL TRAINING COMPLETE")
    print(f"{'='*55}")
    print(f"  Test Accuracy  : {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  CV Mean±Std    : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"{'='*55}\n")
    present = sorted(y.unique())
    present_names = [GRADE_LABELS[i] for i in present]
    print(classification_report(y_test, y_pred, labels=present, target_names=present_names, zero_division=0))

    # Feature importances
    importances = pipeline.named_steps['clf'].feature_importances_
    feat_imp = dict(zip(FEATURES, importances.round(4).tolist()))

    # Dataset stats for dashboard
    stats = {
        'total_samples': int(len(df)),
        'quality_distribution': {str(k): int(v) for k, v in df['quality'].value_counts().sort_index().items()},
        'grade_distribution':   {GRADE_LABELS[i]: int((y == i).sum()) for i in range(5)},
        'feature_means':        {f: float(round(df[f].mean(), 4)) for f in FEATURES},
        'feature_stds':         {f: float(round(df[f].std(),  4)) for f in FEATURES},
        'feature_mins':         {f: float(round(df[f].min(),  4)) for f in FEATURES},
        'feature_maxs':         {f: float(round(df[f].max(),  4)) for f in FEATURES},
    }

    meta = {
        'accuracy':             round(float(acc), 4),
        'cv_mean':              round(float(cv_scores.mean()), 4),
        'cv_std':               round(float(cv_scores.std()),  4),
        'features':             FEATURES,
        'grade_labels':         GRADE_LABELS,
        'grade_colors':         GRADE_COLORS,
        'feature_importances':  feat_imp,
        'dataset_stats':        stats,
    }

    base = os.path.dirname(__file__)
    joblib.dump(pipeline, os.path.join(base, 'wine_model.pkl'))
    with open(os.path.join(base, 'model_meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ Saved wine_model.pkl  &  model_meta.json")
    return pipeline, meta


if __name__ == '__main__':
    train()
