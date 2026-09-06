# Base compartilhada por todo schema Pydantic do projeto: converte
# snake_case (Python) <-> camelCase (JSON, contrato do frontend) e permite
# construir o schema a partir de um objeto SQLAlchemy (from_attributes).
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
