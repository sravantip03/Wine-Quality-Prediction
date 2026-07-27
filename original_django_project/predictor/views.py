import json
import joblib
import numpy as np
from pathlib import Path
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib import messages
from .models import WinePrediction

# ── Load model once at startup ────────────────────────────────────────────────
_MODEL = None
_META  = None

def _load_model():
    global _MODEL, _META
    if _MODEL is None:
        _MODEL = joblib.load(settings.ML_MODEL_PATH)
        with open(settings.ML_META_PATH) as f:
            _META = json.load(f)
    return _MODEL, _META


GRADE_LABELS = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']

# Quality score ≈ grade index + 3 (so grade 0 → quality 3, grade 4 → quality 7+)
GRADE_TO_QUALITY = {0: 3, 1: 5, 2: 6, 3: 7, 4: 9}


# ── Feature metadata for form ─────────────────────────────────────────────────
FEATURE_INFO = [
    {
        'name': 'fixed_acidity',
        'label': 'Fixed Acidity',
        'unit': 'g/dm³',
        'min': 4.0, 'max': 16.0, 'step': 0.1, 'default': 8.3,
        'help': 'Most acids in wine (tartaric, malic)',
        'icon': '⚗️',
    },
    {
        'name': 'volatile_acidity',
        'label': 'Volatile Acidity',
        'unit': 'g/dm³',
        'min': 0.1, 'max': 1.6, 'step': 0.01, 'default': 0.53,
        'help': 'Acetic acid level; too high → vinegar taste',
        'icon': '🌡️',
    },
    {
        'name': 'citric_acid',
        'label': 'Citric Acid',
        'unit': 'g/dm³',
        'min': 0.0, 'max': 1.0, 'step': 0.01, 'default': 0.27,
        'help': 'Adds freshness and flavor',
        'icon': '🍋',
    },
    {
        'name': 'residual_sugar',
        'label': 'Residual Sugar',
        'unit': 'g/dm³',
        'min': 1.0, 'max': 15.0, 'step': 0.1, 'default': 2.5,
        'help': 'Sugar remaining after fermentation',
        'icon': '🍬',
    },
    {
        'name': 'chlorides',
        'label': 'Chlorides',
        'unit': 'g/dm³',
        'min': 0.01, 'max': 0.6, 'step': 0.001, 'default': 0.087,
        'help': 'Salt content in wine',
        'icon': '🧂',
    },
    {
        'name': 'free_sulfur_dioxide',
        'label': 'Free Sulfur Dioxide',
        'unit': 'mg/dm³',
        'min': 1.0, 'max': 72.0, 'step': 0.5, 'default': 15.9,
        'help': 'Free form of SO₂; prevents microbial growth',
        'icon': '💨',
    },
    {
        'name': 'total_sulfur_dioxide',
        'label': 'Total Sulfur Dioxide',
        'unit': 'mg/dm³',
        'min': 6.0, 'max': 289.0, 'step': 1.0, 'default': 46.0,
        'help': 'Total SO₂; preservative in wine',
        'icon': '🧪',
    },
    {
        'name': 'density',
        'label': 'Density',
        'unit': 'g/cm³',
        'min': 0.990, 'max': 1.004, 'step': 0.0001, 'default': 0.9967,
        'help': 'Depends on alcohol & sugar content',
        'icon': '⚖️',
    },
    {
        'name': 'ph',
        'label': 'pH',
        'unit': '',
        'min': 2.7, 'max': 4.1, 'step': 0.01, 'default': 3.31,
        'help': 'Acidity scale; wines range 2.9–4.0',
        'icon': '🔬',
    },
    {
        'name': 'sulphates',
        'label': 'Sulphates',
        'unit': 'g/dm³',
        'min': 0.33, 'max': 2.0, 'step': 0.01, 'default': 0.66,
        'help': 'Wine additive; antimicrobial & antioxidant',
        'icon': '🛡️',
    },
    {
        'name': 'alcohol',
        'label': 'Alcohol',
        'unit': '% vol',
        'min': 8.0, 'max': 15.0, 'step': 0.1, 'default': 10.4,
        'help': 'Alcohol percentage by volume',
        'icon': '🍷',
    },
]


# ── Views ─────────────────────────────────────────────────────────────────────

def home(request):
    _, meta = _load_model()
    recent = WinePrediction.objects.all()[:5]
    total  = WinePrediction.objects.count()

    # Grade distribution from predictions in DB
    grade_counts = {}
    for g in GRADE_LABELS:
        grade_counts[g] = WinePrediction.objects.filter(predicted_grade=g).count()

    context = {
        'meta':         meta,
        'recent':       recent,
        'total':        total,
        'grade_counts': json.dumps(grade_counts),
        'acc_pct':      round(meta['accuracy'] * 100, 2),
        'cv_pct':       round(meta['cv_mean']  * 100, 2),
    }
    return render(request, 'predictor/home.html', context)


def predict_view(request):
    _, meta = _load_model()

    if request.method == 'POST':
        return _handle_prediction(request, meta)

    context = {
        'features': FEATURE_INFO,
        'meta':     meta,
    }
    return render(request, 'predictor/predict.html', context)


def _handle_prediction(request, meta):
    model, _ = _load_model()
    try:
        field_map = {
            'fixed_acidity':        'fixed acidity',
            'volatile_acidity':     'volatile acidity',
            'citric_acid':          'citric acid',
            'residual_sugar':       'residual sugar',
            'chlorides':            'chlorides',
            'free_sulfur_dioxide':  'free sulfur dioxide',
            'total_sulfur_dioxide': 'total sulfur dioxide',
            'density':              'density',
            'ph':                   'pH',
            'sulphates':            'sulphates',
            'alcohol':              'alcohol',
        }

        values = []
        for form_field in field_map:
            val = float(request.POST.get(form_field, 0))
            values.append(val)

        X = np.array([values])
        grade_idx   = model.predict(X)[0]
        probas      = model.predict_proba(X)[0]
        confidence  = round(float(probas.max()) * 100, 1)
        grade_label = GRADE_LABELS[grade_idx]
        quality_val = GRADE_TO_QUALITY.get(grade_idx, 6)

        wine_name = request.POST.get('wine_name', 'Red Wine').strip() or 'Red Wine'

        # Map field_map keys to model field names
        pred = WinePrediction.objects.create(
            fixed_acidity        = values[0],
            volatile_acidity     = values[1],
            citric_acid          = values[2],
            residual_sugar       = values[3],
            chlorides            = values[4],
            free_sulfur_dioxide  = values[5],
            total_sulfur_dioxide = values[6],
            density              = values[7],
            ph                   = values[8],
            sulphates            = values[9],
            alcohol              = values[10],
            predicted_quality    = quality_val,
            predicted_grade      = grade_label,
            confidence           = confidence,
            wine_name            = wine_name,
        )

        # Build probabilities dict for template
        all_probas = {}
        for i, g in enumerate(GRADE_LABELS):
            if i < len(probas):
                all_probas[g] = round(float(probas[i]) * 100, 1)
            else:
                all_probas[g] = 0.0

        context = {
            'prediction':  pred,
            'probas':      json.dumps(all_probas),
            'features':    FEATURE_INFO,
            'input_vals':  dict(zip(field_map.keys(), values)),
            'meta':        meta,
        }
        return render(request, 'predictor/result.html', context)

    except (ValueError, KeyError) as e:
        messages.error(request, f'Invalid input: {e}')
        return redirect('predict')


def history_view(request):
    predictions = WinePrediction.objects.all()

    grade_filter = request.GET.get('grade', '')
    if grade_filter:
        predictions = predictions.filter(predicted_grade=grade_filter)

    # Stats
    total = WinePrediction.objects.count()
    grade_dist = {g: WinePrediction.objects.filter(predicted_grade=g).count() for g in GRADE_LABELS}

    context = {
        'predictions':   predictions,
        'total':         total,
        'grade_dist':    json.dumps(grade_dist),
        'grade_filter':  grade_filter,
        'grade_labels':  GRADE_LABELS,
    }
    return render(request, 'predictor/history.html', context)


def dashboard_view(request):
    _, meta = _load_model()
    total = WinePrediction.objects.count()

    grade_dist = {g: WinePrediction.objects.filter(predicted_grade=g).count() for g in GRADE_LABELS}
    feat_imp = meta.get('feature_importances', {})

    # Avg confidence per grade
    conf_by_grade = {}
    for g in GRADE_LABELS:
        qs = WinePrediction.objects.filter(predicted_grade=g)
        if qs.exists():
            avg_c = sum(p.confidence for p in qs) / qs.count()
            conf_by_grade[g] = round(avg_c, 1)
        else:
            conf_by_grade[g] = 0

    model_params = [
        ('n_estimators',    '200',         'Number of decision trees in the forest'),
        ('max_depth',       '12',          'Maximum depth of each tree'),
        ('min_samples_split','4',          'Minimum samples required to split a node'),
        ('min_samples_leaf','2',           'Minimum samples required at a leaf node'),
        ('class_weight',    'balanced',    'Adjusts weights inversely proportional to class frequencies'),
        ('scaler',          'StandardScaler','Normalises features to zero mean, unit variance'),
        ('cv_folds',        '5',           'Number of cross-validation folds'),
        ('test_size',       '20%',         'Fraction of data held out for testing'),
        ('random_state',    '42',          'Seed for reproducible results'),
    ]

    context = {
        'meta':          meta,
        'total':         total,
        'grade_dist':    json.dumps(grade_dist),
        'feat_imp':      json.dumps(feat_imp),
        'conf_by_grade': json.dumps(conf_by_grade),
        'acc_pct':       round(meta['accuracy'] * 100, 2),
        'model_params':  model_params,
    }
    return render(request, 'predictor/dashboard.html', context)


def delete_prediction(request, pk):
    pred = get_object_or_404(WinePrediction, pk=pk)
    pred.delete()
    messages.success(request, 'Prediction deleted.')
    return redirect('history')


def api_predict(request):
    """JSON API endpoint for prediction."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    model, _ = _load_model()
    try:
        body = json.loads(request.body)
        keys = ['fixed acidity','volatile acidity','citric acid','residual sugar',
                'chlorides','free sulfur dioxide','total sulfur dioxide',
                'density','pH','sulphates','alcohol']
        values = [float(body[k]) for k in keys]
        X = np.array([values])
        grade_idx  = int(model.predict(X)[0])
        probas     = model.predict_proba(X)[0]
        confidence = round(float(probas.max()) * 100, 1)
        return JsonResponse({
            'grade':      GRADE_LABELS[grade_idx],
            'quality':    GRADE_TO_QUALITY.get(grade_idx, 6),
            'confidence': confidence,
            'probabilities': {GRADE_LABELS[i]: round(float(p)*100,1)
                              for i, p in enumerate(probas)},
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
