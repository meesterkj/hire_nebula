from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr

# SQLAlchemy model
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    organisation = Column(String, nullable=True)
    position = Column(String, nullable=True)

# Pydantic models for API request/response
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    organisation: str | None = None
    position: str | None = None

class UserResponse(BaseModel):
    userID: int
    name: str
    email: EmailStr
    organisation: str | None = None
    position: str | None = None

    class Config:
        orm_mode = True # Compatibility with SQLAlchemy models
