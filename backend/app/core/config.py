from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "your_google_api_key_here")

    class Config:
        env_file = ".env"

settings = Settings()
