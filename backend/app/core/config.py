from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "your_google_api_key_here")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "your_anthropic_api_key_here")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")

    class Config:
        env_file = ".env"

settings = Settings()
