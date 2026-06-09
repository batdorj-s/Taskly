# Taskly Todo App

Энэхүү төсөл нь FastAPI (Backend) болон Next.js (Frontend) ашиглан хийсэн ажил удирдах систем юм.

## Local дээр ажиллуулах заавар

Төслийг ажиллуулахын тулд хоёр тусдаа терминал нээх шаардлагатай.

### 1. Backend (FastAPI) ажиллуулах
Үндсэн (root) хавтаст:

```bash
# Сангуудыг суулгах
pip install -r requirements.txt

# Backend-ийг асаах
uvicorn index:app --reload --port 8000
```
API хаяг: `http://127.0.0.1:8000`

### 2. Frontend (Next.js) ажиллуулах
Frontend хавтас руу орох:

```bash
cd frontend

# Сангуудыг суулгах
npm install

# Frontend-ийг асаах
npm run dev
```
Вэб хаяг: `http://localhost:3000`

## Чухал тохиргоо (Local)
Аппликейшн зөв ажиллахын тулд `frontend/src/lib/api.ts` файлд дараах тохиргоог шалгана уу:
```typescript
const API_URL = 'http://127.0.0.1:8000';
```

## Технологийн стек
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL (Supabase)
- **Frontend**: Next.js (React), TailwindCSS, Axios
