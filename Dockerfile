# Build multi-etapa: builda o frontend (Node) e roda o backend (Python) que
# serve os arquivos buildados. Uma imagem só, gerada do zero a cada deploy —
# não precisa buildar o frontend na sua máquina.

# Etapa 1: build do frontend
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Etapa 2: backend + frontend buildado
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./frontend_dist

ENV PYTHONUNBUFFERED=1
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
