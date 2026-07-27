# 🍷 VinoAI – Wine Quality Prediction System

> A Django + Machine Learning Mini Project that predicts the quality of red wine
> using physicochemical properties and a trained Random Forest classifier.

---

## 📌 Project Overview

| Item            | Detail                                    |
|-----------------|-------------------------------------------|
| **Domain**      | Machine Learning / Data Science           |
| **Framework**   | Django 4.2                                |
| **Algorithm**   | Random Forest Classifier (200 trees)      |
| **Dataset**     | UCI Wine Quality Dataset (Red Wine)       |
| **Features**    | 11 physicochemical inputs                 |
| **Output**      | 5 quality grades: Poor → Excellent        |
| **Language**    | Python 3.10+                              |

---

## 🏗️ Project Structure

```
wine_quality_project/
│
├── wine_quality_project/       # Django settings & URLs
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── predictor/                  # Main Django app
│   ├── ml/
│   │   ├── train_model.py      # ML training script
│   │   ├── wine_model.pkl      # Trained model (auto-generated)
│   │   └── model_meta.json     # Accuracy, CV, feature importances
│   │
│   ├── templates/predictor/
│   │   ├── base.html           # Common layout, navbar
│   │   ├── home.html           # Landing page with stats
│   │   ├── predict.html        # Wine input form (with sliders)
│   │   ├── result.html         # Prediction result + charts
│   │   ├── history.html        # All predictions (filterable)
│   │   └── dashboard.html      # Analytics & model insights
│   │
│   ├── models.py               # WinePrediction Django model
│   ├── views.py                # All view functions + API
│   ├── urls.py                 # App URL routing
│   └── apps.py
│
├── seed_data.py                # Loads 12 demo predictions
├── manage.py
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Installation

### Step 1 — Clone / Extract the project
```bash
cd wine_quality_project
```

### Step 2 — Create virtual environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
```

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Train the ML model
```bash
python predictor/ml/train_model.py
```
This downloads the UCI Wine Quality Dataset and saves:
- `predictor/ml/wine_model.pkl` — the trained pipeline
- `predictor/ml/model_meta.json` — accuracy, CV scores, feature importances

### Step 5 — Apply database migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 6 — Seed demo data (optional but recommended)
```bash
python seed_data.py
```

### Step 7 — Run the server
```bash
python manage.py runserver
```

Open **http://127.0.0.1:8000/** in your browser 🎉

---

## 🌐 Pages & URLs

| URL             | Page            | Description                               |
|-----------------|-----------------|-------------------------------------------|
| `/`             | Home            | Landing page, stats, recent predictions   |
| `/predict/`     | Predict         | Input form with sliders + quick presets   |
| `/history/`     | History         | All predictions, filterable by grade      |
| `/dashboard/`   | Dashboard       | Feature importances, charts, model info   |
| `/api/predict/` | REST API        | JSON POST endpoint                        |

---

## 🔬 Machine Learning Details

### Features Used (11 inputs)
| # | Feature                | Unit     | Description                                |
|---|------------------------|----------|--------------------------------------------|
| 1 | Fixed Acidity          | g/dm³    | Primary acids (tartaric, malic)            |
| 2 | Volatile Acidity       | g/dm³    | Acetic acid — excess causes vinegar taste  |
| 3 | Citric Acid            | g/dm³    | Adds freshness                             |
| 4 | Residual Sugar         | g/dm³    | Sugar after fermentation                   |
| 5 | Chlorides              | g/dm³    | Salt content                               |
| 6 | Free Sulfur Dioxide    | mg/dm³   | Antimicrobial SO₂ fraction                 |
| 7 | Total Sulfur Dioxide   | mg/dm³   | Total SO₂ preservative                     |
| 8 | Density                | g/cm³    | Depends on alcohol & sugar                 |
| 9 | pH                     | —        | Acidity scale                              |
|10 | Sulphates              | g/dm³    | Antioxidant additive                       |
|11 | Alcohol                | % vol    | Alcohol by volume                          |

### Output Classes
| Grade         | Quality Score | Description              |
|---------------|---------------|--------------------------|
| Poor          | 3             | Significant quality issues |
| Below Average | 5             | Below par                |
| Average       | 6             | Acceptable               |
| Good          | 7             | Well-balanced            |
| Excellent     | 9             | Premium quality          |

### Model Pipeline
```
Raw Input → StandardScaler → RandomForestClassifier (200 trees)
```

---

## 📡 REST API Usage

```bash
curl -X POST http://127.0.0.1:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "fixed acidity": 10.5,
    "volatile acidity": 0.28,
    "citric acid": 0.56,
    "residual sugar": 2.0,
    "chlorides": 0.065,
    "free sulfur dioxide": 8,
    "total sulfur dioxide": 22,
    "density": 0.994,
    "pH": 3.12,
    "sulphates": 0.92,
    "alcohol": 13.5
  }'
```

**Response:**
```json
{
  "grade": "Good",
  "quality": 7,
  "confidence": 86.1,
  "probabilities": {
    "Poor": 0.0,
    "Below Average": 2.1,
    "Average": 11.8,
    "Good": 86.1,
    "Excellent": 0.0
  }
}
```

---

## 👥 Team / Authors

- **Mini Project** — B.Tech / BCA / MCA (AI & Data Science)
- **Year** — 2024–25

---

## 📚 References

1. Cortez, P. et al. (2009). *Modeling wine preferences by data mining from physicochemical properties.* Decision Support Systems, 47(4), 547–553.
2. UCI Machine Learning Repository — Wine Quality Dataset
3. Scikit-learn Documentation — RandomForestClassifier
4. Django Documentation — https://docs.djangoproject.com
