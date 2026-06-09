# models.py - Өгөгдлийн сангийн хүснэгтүүд болон Pydantic схемүүд

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- SQLALCHEMY MODELS (Өгөгдлийн сангийн бүтэц) ---

# Хэрэглэгчийн мэдээллийг хадгалах 'users' хүснэгт
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True) # Дахин давтагдахгүй ID
    email = Column(String, unique=True, index=True)    # Хэрэглэгчийн мэйл (давхардахгүй)
    hashed_password = Column(String)                   # Нууцалсан нууц үг
    created_at = Column(DateTime, default=datetime.utcnow) # Бүртгүүлсэн огноо

    # Хэрэглэгч болон тэдний ажлуудын хоорондын холбоо (Нэг хэрэглэгч олон ажилтай байж болно)
    tasks = relationship("Task", back_populates="owner")



# Хийх ажлын мэдээллийг хадгалах 'tasks' хүснэгт
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)                  # Ажлын гарчиг
    description = Column(String)                        # Дэлгэрэнгүй тайлбар
    category = Column(String)                           # Ангилал (жишээ нь: Гэр, Ажил)
    deadline = Column(DateTime)                         # Дуусах хугацаа
    priority = Column(String)                           # Чухал түвшин (High, Medium, Low)
    status = Column(String, default="Pending")          # Төлөв (Pending, Completed)
    user_id = Column(Integer, ForeignKey("users.id"))   # Аль хэрэглэгчийн ажил болохыг заах ID
    
    # Ажил болон түүнийг эзэмшигч хэрэглэгчийн холбоо
    owner = relationship("User", back_populates="tasks")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Level(Base):
    __tablename__ = "levels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Priority(Base):
    __tablename__ = "priorities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Status(Base):
    __tablename__ = "statuses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)


# --- PYDANTIC SCHEMAS (API-аар дамжих өгөгдлийн дүрэм) ---

# Хэрэглэгч шинээр бүртгүүлэхэд шаардагдах өгөгдөл
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Хэрэглэгчийн мэдээллийг API-аар буцаахад ашиглах схем (нууц үгийг буцаахгүй)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    
    class Config:
        from_attributes = True # SQLAlchemy моделийг Pydantic руу хөрвүүлэх боломж олгоно

# JWT Token-ийг буцаах схем
class Token(BaseModel):
    access_token: str
    token_type: str

# Task-ийн үндсэн талбарууд (бүх task-тай холбоотой схемүүдэд ашиглагдана)
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    deadline: datetime
    priority: str
    status: str = "Pending"

# Шинэ Task үүсгэхэд ашиглах схем
class TaskCreate(TaskBase):
    pass

# Task-ийн мэдээллийг API-аар буцаахад ашиглах схем
class TaskResponse(TaskBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
