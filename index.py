# main.py - API-ийн үндсэн логик, Auth болон Endpoints

import os
import re
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from jose import JWTError, jwt
from passlib.context import CryptContext

import models
import database
from database import engine, get_db

# Өгөгдлийн сангийн хүснэгтүүдийг анх удаа асаахад автоматаар үүсгэнэ
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo API for Interview")

# --- CORS SETTINGS (Frontend-ээс хандах зөвшөөрөл) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- AUTHENTICATION SETUP (Нууцлалын тохиргоо) ---

# Нууц үг шалгах функц
def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нууц үг 8-аас дээш тэмдэгттэй байх ёстой.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нууц үгэнд ядаж 1 ТОМ үсэг орох ёстой.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нууц үгэнд ядаж 1 жижиг үсэг орох ёстой.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нууц үгэнд ядаж 1 тусгай тэмдэгт орох ёстой.")

# Нууц үгийг hash-лах (bcrypt) тохиргоо
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Token үүсгэхэд ашиглах нууц түлхүүр
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_FOR_INTERVIEW")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token 60 минутын дараа хүчингүй болно

# OAuth2 стандартын дагуу token авах замыг зааж байна
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Нууц үг шалгах функц (Plain password-ийг Hashed password-той харьцуулна)
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Нууц үгийг hash-лах функц
def get_password_hash(password):
    return pwd_context.hash(password)

# JWT Access Token үүсгэх функц
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Одоо нэвтэрсэн байгаа хэрэглэгчийг Token-оор нь тодорхойлох функц (Dependency)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Хэрэглэгчийг баталгаажуулж чадсангүй",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token-оос мэдээллийг уншиж авна
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Өгөгдлийн сангаас хэрэглэгчийг хайж олно
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# --- USER ENDPOINTS (Хэрэглэгчийн бүртгэл ба нэвтрэлт) ---

# Шинэ хэрэглэгч бүртгэх
@app.post("/register", response_model=models.UserResponse)
def register(user: models.UserCreate, db: Session = Depends(get_db)):
    validate_password(user.password)
    # Email бүртгэлтэй эсэхийг шалгана
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна")
    
    # Нууц үгийг hash-лаад хадгална
    hashed_pwd = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Нэвтрэх (Username болон Password-оор Token авна)
@app.post("/token", response_model=models.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="И-мэйл эсвэл нууц үг буруу байна")
    
    # Access Token үүсгэж буцаана
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ADMIN ENDPOINTS ---

class AdminLogin(models.BaseModel):
    username: str
    password: str

@app.post("/admin/login")
def admin_login(creds: AdminLogin):
    if creds.username == "superadmin" and creds.password == "Admin@123!":
        access_token = create_access_token(data={"sub": "admin_user", "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail="Админы нэр эсвэл нууц үг буруу байна")

@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"id": u.id, "email": u.email, "created_at": u.created_at} for u in users]

@app.post("/admin/categories")
def create_category(name: str, db: Session = Depends(get_db)):
    new_cat = models.Category(name=name)
    db.add(new_cat)
    db.commit()
    return {"msg": "Ангилал нэмэгдлээ"}

@app.post("/admin/priorities")
def create_priority(name: str, db: Session = Depends(get_db)):
    new_prio = models.Priority(name=name)
    db.add(new_prio)
    db.commit()
    return {"msg": "Түвшин нэмэгдлээ"}

@app.post("/admin/statuses")
def create_status(name: str, db: Session = Depends(get_db)):
    new_stat = models.Status(name=name)
    db.add(new_stat)
    db.commit()
    return {"msg": "Төлөв нэмэгдлээ"}

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/priorities")
def get_priorities(db: Session = Depends(get_db)):
    return db.query(models.Priority).all()

@app.get("/statuses")
def get_statuses(db: Session = Depends(get_db)):
    return db.query(models.Status).all()

@app.put("/admin/categories/{id}")
def update_category(id: int, name: str, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == id).first()
    if not db_cat: raise HTTPException(status_code=404, detail="Олдсонгүй")
    db_cat.name = name
    db.commit()
    return {"msg": "Ангилал шинэчлэгдлээ"}

@app.put("/admin/priorities/{id}")
def update_priority(id: int, name: str, db: Session = Depends(get_db)):
    db_prio = db.query(models.Priority).filter(models.Priority.id == id).first()
    if not db_prio: raise HTTPException(status_code=404, detail="Олдсонгүй")
    db_prio.name = name
    db.commit()
    return {"msg": "Түвшин шинэчлэгдлээ"}

@app.put("/admin/statuses/{id}")
def update_status(id: int, name: str, db: Session = Depends(get_db)):
    db_stat = db.query(models.Status).filter(models.Status.id == id).first()
    if not db_stat: raise HTTPException(status_code=404, detail="Олдсонгүй")
    db_stat.name = name
    db.commit()
    return {"msg": "Төлөв шинэчлэгдлээ"}


@app.put("/admin/users/{id}")
def update_user(id: int, email: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Хэрэглэгч олдсонгүй")
    db_user.email = email
    db.commit()
    return {"msg": "Хэрэглэгч шинэчлэгдлээ"}

@app.delete("/admin/users/{id}")
def delete_user(id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == id).first()
    if not db_user: raise HTTPException(status_code=404, detail="Хэрэглэгч олдсонгүй")
    db.delete(db_user)
    db.commit()
    return {"msg": "Хэрэглэгч устгагдлаа"}

# Шинэ ажил үүсгэх
@app.post("/tasks/", response_model=models.TaskResponse)
def create_task(task: models.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 'user_id' талбарт одоо нэвтэрсэн байгаа хэрэглэгчийн ID-г оноож өгнө
    new_task = models.Task(**task.dict(), user_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# Өөрийн бүх ажлуудыг харах (Pagination ашигласан)
@app.get("/tasks/", response_model=List[models.TaskResponse])
def read_tasks(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Зөвхөн тухайн хэрэглэгчийн ажлуудыг 'skip' болон 'limit' ашиглан шүүж авна
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).offset(skip).limit(limit).all()
    return tasks

# Тухайлсан нэг ажлын мэдээллийг ID-аар харах
@app.get("/tasks/{task_id}", response_model=models.TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Ажил олдсон ч өөр хэрэглэгчийнх бол харах боломжгүй
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Ажил олдсонгүй эсвэл танд харах эрх байхгүй")
    return task

# Ажлын мэдээллийг шинэчлэх (Update)
@app.put("/tasks/{task_id}", response_model=models.TaskResponse)
def update_task(task_id: int, updated_task: models.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Засах ажил олдсонгүй")
    
    # Ирсэн шинэ өгөгдлүүдээр task-ийн талбаруудыг шинэчилнэ
    for key, value in updated_task.dict().items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

# Ажлыг устгах
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Устгах ажил олдсонгүй")
    
    db.delete(db_task)
    db.commit()
    return {"detail": "Ажил амжилттай устгагдлаа"}
