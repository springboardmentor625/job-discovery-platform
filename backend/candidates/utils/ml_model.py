import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB


MODEL_DIR = "trained_model"


class ResumeJobMatcher:

    def __init__(self):

        vectorizer_path = os.path.join(
            MODEL_DIR,
            "vectorizer.pkl"
        )

        model_path = os.path.join(
            MODEL_DIR,
            "naive_bayes.pkl"
        )

        if os.path.exists(vectorizer_path) and os.path.exists(model_path):

            self.vectorizer = joblib.load(vectorizer_path)
            self.model = joblib.load(model_path)

        else:

            self.vectorizer = TfidfVectorizer(
                stop_words="english"
            )

            self.model = MultinomialNB()

    def train(self, texts, labels):

        X = self.vectorizer.fit_transform(texts)

        self.model.fit(X, labels)

        os.makedirs(
            MODEL_DIR,
            exist_ok=True
        )

        joblib.dump(
            self.vectorizer,
            os.path.join(MODEL_DIR, "vectorizer.pkl")
        )

        joblib.dump(
            self.model,
            os.path.join(MODEL_DIR, "naive_bayes.pkl")
        )

        print("Model trained successfully!")

    def predict(self, text):

        X = self.vectorizer.transform([text])

        probability = self.model.predict_proba(X)[0][1]

        return float(round(probability * 100, 2))