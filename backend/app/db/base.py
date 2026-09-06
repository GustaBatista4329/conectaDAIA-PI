# Base declarativa do SQLAlchemy. Os models se registram nela sozinhos, ao
# serem importados (ver app/models/__init__.py — não o contrário, pra evitar
# import circular entre este arquivo e os models).
from sqlalchemy.orm import declarative_base

Base = declarative_base()
