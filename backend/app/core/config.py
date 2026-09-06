# Settings (pydantic-settings): DATABASE_URL, SECRET_KEY, etc via .env
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def _normaliza_driver_async(cls, v: str) -> str:
        # Railway (e outros provedores) entregam DATABASE_URL como
        # "postgres://..." ou "postgresql://..." (driver síncrono). A app usa
        # asyncpg — normaliza aqui pra não depender de montar a URL na mão no
        # painel do Railway. Local (.env) já vem com +asyncpg e passa direto.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
