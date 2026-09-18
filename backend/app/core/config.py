from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwipeX API"
    DATABASE_URL: str
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()