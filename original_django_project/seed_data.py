"""
Seed demo data — run once to populate the dashboard.
Usage:  python seed_data.py
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wine_quality_project.settings')
django.setup()

import json, joblib
import numpy as np
from pathlib import Path
from predictor.models import WinePrediction

# Clear existing
WinePrediction.objects.all().delete()

MODEL = joblib.load('predictor/ml/wine_model.pkl')
with open('predictor/ml/model_meta.json') as f:
    META = json.load(f)

GRADE_LABELS = META['grade_labels']
GRADE_TO_QUALITY = {0: 3, 1: 5, 2: 6, 3: 7, 4: 9}

SAMPLES = [
    # (name, fixed_ac, volatile_ac, citric, residual, chlorides, free_so2, total_so2, density, ph, sulphates, alcohol)
    ("Château Petite Réserve", 10.5, 0.28, 0.56, 2.0, 0.065, 8,  22,  0.9940, 3.12, 0.92, 13.5),
    ("Napa Valley Blend",      9.2,  0.40, 0.35, 2.5, 0.080, 14, 40,  0.9960, 3.25, 0.75, 11.8),
    ("House Red 2023",         8.3,  0.52, 0.27, 2.5, 0.087, 16, 46,  0.9967, 3.31, 0.66, 10.4),
    ("Rioja Barrel Aged",      9.8,  0.32, 0.48, 2.2, 0.072, 10, 28,  0.9950, 3.18, 0.85, 12.9),
    ("Budget Bistro Red",      7.5,  0.85, 0.10, 1.8, 0.140, 6,  18,  0.9990, 3.55, 0.45, 9.0),
    ("Sangiovese Classic",     9.5,  0.38, 0.42, 2.1, 0.075, 12, 34,  0.9955, 3.22, 0.80, 12.2),
    ("Bordeaux Style",         11.0, 0.25, 0.60, 2.3, 0.060, 7,  20,  0.9935, 3.10, 0.95, 14.0),
    ("Everyday Merlot",        8.0,  0.60, 0.20, 2.8, 0.095, 18, 52,  0.9975, 3.38, 0.58, 10.0),
    ("Tempranillo Reserve",    10.2, 0.30, 0.52, 2.0, 0.068, 9,  25,  0.9945, 3.15, 0.90, 13.2),
    ("Tavern Red",             7.8,  0.72, 0.15, 2.0, 0.120, 8,  24,  0.9985, 3.48, 0.50, 9.5),
    ("Pinot Noir Prestige",    9.0,  0.34, 0.44, 2.3, 0.070, 11, 30,  0.9952, 3.20, 0.82, 12.5),
    ("Cellar Selection",       10.8, 0.27, 0.58, 1.9, 0.062, 7,  21,  0.9938, 3.11, 0.93, 13.8),
]

created = 0
for s in SAMPLES:
    name, fa, va, ca, rs, cl, fso2, tso2, den, ph, sul, alc = s
    X = np.array([[fa, va, ca, rs, cl, fso2, tso2, den, ph, sul, alc]])
    grade_idx  = int(MODEL.predict(X)[0])
    probas     = MODEL.predict_proba(X)[0]
    confidence = round(float(probas.max()) * 100, 1)

    WinePrediction.objects.create(
        wine_name            = name,
        fixed_acidity        = fa, volatile_acidity = va, citric_acid = ca,
        residual_sugar       = rs, chlorides        = cl,
        free_sulfur_dioxide  = fso2, total_sulfur_dioxide = tso2,
        density              = den, ph               = ph,
        sulphates            = sul, alcohol          = alc,
        predicted_quality    = GRADE_TO_QUALITY.get(grade_idx, 6),
        predicted_grade      = GRADE_LABELS[grade_idx],
        confidence           = confidence,
    )
    created += 1
    print(f"  ✅ {name:<35} → {GRADE_LABELS[grade_idx]} ({confidence}%)")

print(f"\n🍷 Seeded {created} demo predictions successfully!")
