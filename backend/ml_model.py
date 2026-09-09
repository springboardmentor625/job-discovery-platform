import json

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


class SwipeMLModel:

    def __init__(self):
        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(
                max_iter=1000
            ))
        ])

        self.is_trained = False

    def train(self, X, y):

        # Need both LEFT and RIGHT
        if len(set(y)) < 2:
            print("ML: Not enough classes to train")
            return False

        if len(X) < 10:
            print("ML: Not enough swipe data")
            return False

        self.model.fit(X, y)

        self.is_trained = True

        print(
            f"ML: Model trained using {len(X)} swipe records"
        )

        return True

    def predict_right_probability(self, features):

        if not self.is_trained:
            return None

        probability = self.model.predict_proba(
            [features]
        )[0][1]

        return round(probability * 100, 2)