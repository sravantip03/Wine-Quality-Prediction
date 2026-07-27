from django.db import models
from django.utils import timezone


GRADE_CHOICES = [
    ('Poor',          'Poor'),
    ('Below Average', 'Below Average'),
    ('Average',       'Average'),
    ('Good',          'Good'),
    ('Excellent',     'Excellent'),
]


class WinePrediction(models.Model):
    # Input Features
    fixed_acidity       = models.FloatField()
    volatile_acidity    = models.FloatField()
    citric_acid         = models.FloatField()
    residual_sugar      = models.FloatField()
    chlorides           = models.FloatField()
    free_sulfur_dioxide = models.FloatField()
    total_sulfur_dioxide= models.FloatField()
    density             = models.FloatField()
    ph                  = models.FloatField()
    sulphates           = models.FloatField()
    alcohol             = models.FloatField()

    # Prediction Output
    predicted_quality   = models.IntegerField()
    predicted_grade     = models.CharField(max_length=20, choices=GRADE_CHOICES)
    confidence          = models.FloatField(default=0.0)   # max class probability
    wine_name           = models.CharField(max_length=100, blank=True, default='Red Wine')

    created_at          = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        verbose_name        = 'Wine Prediction'
        verbose_name_plural = 'Wine Predictions'

    def __str__(self):
        return f"{self.wine_name} → {self.predicted_grade} (Q{self.predicted_quality}) @ {self.created_at:%Y-%m-%d %H:%M}"

    def grade_color(self):
        colors = {
            'Poor':          '#e74c3c',
            'Below Average': '#e67e22',
            'Average':       '#f1c40f',
            'Good':          '#2ecc71',
            'Excellent':     '#27ae60',
        }
        return colors.get(self.predicted_grade, '#cccccc')

    def grade_emoji(self):
        emojis = {
            'Poor': '😞', 'Below Average': '😐',
            'Average': '🙂', 'Good': '😊', 'Excellent': '🏆',
        }
        return emojis.get(self.predicted_grade, '🍷')
