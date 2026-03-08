# EduCard

EduCard is a full-stack cryptographic vCard and academic networking identity generator.

## Project Structure

This is a Monorepo containing:
- /frontend - React 19 + Vite + Tailwind + GSAP + React Router Dom.
- /backend - Python 3 + FastAPI + Pydantic + QRCode.

## Running Locally

### 1. Backend (API)
`ash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
`
*The API will start at http://localhost:8000*

### 2. Frontend (UI)
`ash
cd frontend # (Or educard-landing depending on folder name)
npm install
npm run dev
`
*The app will start at http://localhost:5173*

## Deployment (Phase 4)

### Frontend (Vercel / Netlify)
- **Framework Preset**: Vite
- **Build Command**: 
pm run build
- **Output Directory**: dist

### Backend (Render / Railway)
- **Environment**: Python 3
- **Build Command**: pip install -r requirements.txt
- **Start Command**: uvicorn main:app --host 0.0.0.0 --port 
"@
 = @"
import os
import re

target_dir = r"C:\Users\M Mohammed Rayyan\EduCard\educard-landing\src"

hex_to_color = {
    "111111": "dark",
    "F5F3EE": "light",
    "E8E4DD": "white",
    "E63B2E": "primary",
    "32cd32": "accent",
    "32CD32": "accent",
    "1A1A1A": "slate-800",
    "1a1a1a": "slate-800"
}

def replace_color(match):
    prefix = match.group(1)
    hex_val = match.group(2).upper()
    opacity = match.group(3) or ""
    color_name = hex_to_color.get(hex_val, f"[{hex_val}]")  # fallback to raw if not found
    return f"{prefix}-{color_name}{opacity}"

pattern = re.compile(r'(bg|text|border|shadow)-\[\#([a-fA-F0-9]{6})\](/[0-9]+)?')

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith((".jsx", ".js", ".css")):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # regex replace
            new_content = pattern.sub(replace_color, content)
            
            # GSAP specific replacements
            new_content = new_content.replace("'#111111'", "'#0F172A'")
            new_content = new_content.replace("'#F5F3EE'", "'#F3F4F6'")
            new_content = new_content.replace("rgba(245, 243, 238, 0.7)", "rgba(243, 244, 246, 0.8)")
            new_content = new_content.replace("rgba(17,17,17,0.1)", "rgba(15, 23, 42, 0.1)")

            # Button unified replacements (Targeting standard brutalist button classes)
            new_content = new_content.replace("magnetic-btn bg-primary text-light px-5 py-2 rounded-full font-mono text-xs font-bold overflow-hidden relative group", "btn-primary px-5 py-2 text-xs overflow-hidden relative group")
            new_content = new_content.replace("magnetic-btn bg-primary text-light px-8 py-4 rounded-full font-mono text-sm inline-flex items-center gap-2 group", "btn-primary")
            new_content = new_content.replace("magnetic-btn bg-primary text-light px-12 py-5 rounded-full font-mono text-lg font-bold inline-flex items-center gap-4 group shadow-xl shadow-primary/20", "btn-primary px-12 py-5 text-lg shadow-xl shadow-primary/20")
            new_content = new_content.replace("bg-white text-dark font-bold font-mono py-4 rounded-xl mt-8 flex items-center justify-center gap-2 hover:bg-light transition-colors", "btn-primary w-full py-4 mt-8 justify-center rounded-xl")
            new_content = new_content.replace("bg-dark text-light px-8 py-3 rounded-full font-mono text-sm hover:bg-primary transition-colors", "btn-secondary px-8 py-3 bg-dark hover:bg-primary hover:text-white border-none")
            
            # Fix dynamic generator background pulses ensuring Green accent
            new_content = new_content.replace("bg-primary animate-pulse", "bg-accent animate-pulse")
            new_content = new_content.replace("text-primary uppercase tracking-widest\">Generator Active", "text-accent uppercase tracking-widest\">Generator Active")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

print("Colors Refactored Successfully!")
