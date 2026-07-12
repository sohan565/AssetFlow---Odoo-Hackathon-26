from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    role = Column(String)  # 'Admin' ya 'User'

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    tag_number = Column(String, unique=True, index=True)
    status = Column(String, default="Available")
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)