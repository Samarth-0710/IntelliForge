from sqlalchemy import Column, Integer, String
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)

    hashed_password = Column(String, nullable=False)

    role = Column(String(20), default="admin")

    status = Column(String(20), default="active")