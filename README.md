# EduCard

EduCard is a full-stack cryptographic vCard and academic networking identity generator. Students fill in their academic profile, and EduCard generates a downloadable vCard + QR code that encodes their identity — ready to share digitally or print.

## Project Structure

This is a monorepo containing:

| Folder | Stack | Purpose |
| --- | --- | --- |
| `/frontend` | React 19 + Vite + Tailwind + GSAP | Frontend SPA (landing + generator) |
| `/backend` | Python 3 + FastAPI + QRCode | REST API (vCard + QR generation) |
| `/assets` | — | Shared brand assets (logos, images) |
| `/scripts` | Node.js | Dev utility / refactor scripts |

## Running Locally

### 1. Backend (API)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

> API will start at **http://localhost:8000**

### 2. Frontend (Landing + Generator)

```bash
cd educard-landing
npm install
npm run dev
```

> App will start at **http://localhost:5173**

## Deployment

### Frontend (Vercel / Netlify)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Backend (Render / Railway)
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## API Reference

### `POST /api/generate`

Generates a vCard string and QR code from a student profile.

**Request body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "university": "string",
  "major": "string",
  "email": "string",
  "phone": "string (optional)",
  "portfolio": "string (optional)"
}
```

**Response:**
```json
{
  "status": "success",
  "vcard_raw": "BEGIN:VCARD...",
  "qr_code": "data:image/png;base64,..."
}
```

### `GET /`

Health check endpoint.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, GSAP, React Router DOM
- **Backend**: Python 3, FastAPI, Pydantic, QRCode
- **Identity Format**: vCard 3.0
