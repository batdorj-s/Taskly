# main.py - API-ийн үндсэн логик, Auth болон Endpoints

import os
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from jose import JWTError, jwt
from passlib.context import CryptContext

import models, database
from database import engine, get_db

# Өгөгдлийн сангийн хүснэгтүүдийг анх удаа асаахад автоматаар үүсгэнэ
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Taskly API")

@app.get("/debug-path")
async def debug_path(request: Request):
    return {"path": request.url.path}

# --- CORS SETTINGS (Frontend-ээс хандах зөвшөөрөл) ---
# Таны Frontend байрлаж буй хаяг
origins = [
    "https://frontend-sand-five-49.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- AUTHENTICATION SETUP ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_FOR_INTERVIEW")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Хэрэглэгчийг баталгаажуулж чадсангүй",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- USER ENDPOINTS ---

@app.post("/register", response_model=models.UserResponse)
def register(user: models.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна")
    
    hashed_pwd = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=models.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="И-мэйл эсвэл нууц үг буруу байна")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- TASK ENDPOINTS ---

@app.post("/tasks/", response_model=models.TaskResponse)
def create_task(task: models.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_task = models.Task(**task.dict(), user_id=current_user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/tasks/", response_model=List[models.TaskResponse])
def read_tasks(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=models.TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Ажил олдсонгүй")
    return task

@app.put("/tasks/{task_id}", response_model=models.TaskResponse)
def update_task(task_id: int, updated_task: models.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Засах ажил олдсонгүй")
    for key, value in updated_task.dict().items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Устгах ажил олдсонгүй")
    db.delete(db_task)
    db.commit()
    return {"detail": "Ажил амжилттай устгагдлаа"}