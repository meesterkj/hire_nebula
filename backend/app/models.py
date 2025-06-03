from typing import Optional
from pydantic import BaseModel, EmailStr
from typing import Optional

# Pydantic model for in-memory storage
class User(BaseModel):
    userID: int
    name: str
    email: EmailStr
    organisation: Optional[str] = None
    position: Optional[str] = None

# Pydantic models for API request/response
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    organisation: Optional[str] = None
    position: Optional[str] = None

class UserResponse(BaseModel):
    userID: int
    name: str
    email: EmailStr
    organisation: Optional[str] = None
    position: Optional[str] = None
