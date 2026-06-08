# database.py - Өгөгдлийн сангийн тохиргооны файл

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite өгөгдлийн сангийн файлын замыг зааж байна. 
# Энэ нь төслийн хавтсанд 'todo.db' нэртэй файл үүсгэнэ.
SQLALCHEMY_DATABASE_URL = "sqlite:///./todo.db"

# Өгөгдлийн сантай холбогдох 'engine' үүсгэж байна.
# check_same_thread=False нь SQLite дээр олон хүсэлтийг зэрэг боловсруулахад хэрэгтэй.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Өгөгдлийн сантай харилцах 'session' үүсгэх тохиргоо.
# Энэ нь бидэнд өгөгдөл унших, хадгалах боломжийг олгоно.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Бусад бүх моделиуд (хүснэгтүүд) энэ Base классыг удамшиж авах ёстой.
# Ингэснээр SQLAlchemy тэднийг өгөгдлийн сангийн хүснэгт гэж танина.
Base = declarative_base()

# Энэ функц нь API хүсэлт бүрт өгөгдлийн сангийн түр холболт (session) нээж, 
# ажил дууссаны дараа автоматаар хаах үүрэгтэй (Dependency Injection).
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
