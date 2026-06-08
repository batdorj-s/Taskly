# database.py - Өгөгдлийн сангийн тохиргооны файл

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Өгөгдлийн сангийн холболтын хаяг. 
# Vercel эсвэл Production орчинд 'DATABASE_URL' хувьсагчаас авна.
# Local дээр байхгүй бол SQLite ('todo.db') ашиглана.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo.db")

# SQLAlchemy PostgreSQL-ийн 'postgres://' форматыг 'postgresql://' болгож засах шаардлагатай байдаг
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite болон бусад DB-д зориулсан engine тохиргоо
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Өгөгдлийн сантай харилцах 'session' үүсгэх тохиргоо.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Бусад бүх моделиуд (хүснэгтүүд) энэ Base классыг удамшиж авах ёстой.
Base = declarative_base()

# Энэ функц нь API хүсэлт бүрт өгөгдлийн сангийн түр холболт (session) нээж, 
# ажил дууссаны дараа автоматаар хаах үүрэгтэй (Dependency Injection).
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
