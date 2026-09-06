# Ponto de entrada: cria o FastAPI(), registra CORS, os routers e (se existir)
# o frontend buildado
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

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

# Serve o frontend buildado (frontend/dist copiado pra cá — ver
# APRENDIZADO-BACKEND.md), se existir. Precisa ser o ÚLTIMO registrado: é um
# catch-all, e as rotas de API acima sempre têm prioridade sobre ele.
_FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend_dist")

if os.path.isdir(_FRONTEND_DIST):

    @app.get("/{full_path:path}", include_in_schema=False)
    async def servir_frontend(full_path: str) -> FileResponse:
        candidato = os.path.join(_FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidato):
            return FileResponse(candidato)
        return FileResponse(os.path.join(_FRONTEND_DIST, "index.html"))
