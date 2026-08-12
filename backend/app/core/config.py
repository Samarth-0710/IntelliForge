import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "IntelliForge SOC Platform"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite:///./intelliforge.db"

    SECRET_KEY: str = "intelliforge_soc_jwt_secret_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # AI & Integrations
    GEMINI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    LYZR_API_KEY: str = ""
    N8N_WEBHOOK_URL: str = ""

    # Email Alerts
    ALERT_EMAIL: str = ""
    ALERT_EMAIL_PASSWORD: str = ""
    ALERT_RECEIVER_EMAIL: str = ""

    # SMS Alerts
    SMS_GATEWAY_URL: str = ""
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "INTELI"
    SMS_ALERT_PHONE: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()