from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwipeX API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_USER: str = "swipex_user"
    POSTGRES_PASSWORD: str = "swipex_password"
    POSTGRES_DB: str = "swipex_db"
    DATABASE_URL: str = "postgresql://swipex_user:swipex_password@localhost:5432/swipex_db"
    
    # Security
    SECRET_KEY: str = "generate_a_random_secret_key_here"  # Override in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    class Config:
        env_file = ".env"

settings = Settings()
