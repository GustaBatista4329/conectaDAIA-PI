# Ponto de entrada: cria o FastAPI(), registra CORS e os routers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import admin, auth, candidaturas, candidatos, empresas, vagas

settings = get_settings()

app = FastAPI(title="ConectaDAIA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(candidatos.router)
app.include_router(empresas.router)
app.include_router(vagas.router)
app.include_router(candidaturas.router)
app.include_router(admin.router)
