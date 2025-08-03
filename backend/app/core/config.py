from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Private Lawyer Bot"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "temporary_secret_key_for_development")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Supabase settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project-url.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "your-supabase-key")
    
    # For development, setting these to dummy values to avoid errors
    SUPABASE_MOCK: bool = True
      # NLP model settings
    SPACY_MODEL: str = "en_core_web_lg"
    HF_MODEL_NAME: str = "distilbert-base-uncased"
      # LLM settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    MISTRAL_API_KEY: Optional[str] = os.getenv("MISTRAL_API_KEY", "")
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
