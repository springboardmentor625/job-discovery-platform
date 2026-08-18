from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://origin@localhost:5432/swipex"
    JWT_SECRET_KEY: str = "change-me-to-a-long-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_URL: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
@lru_cache
def get_settings() -> Settings:
    return Settings()