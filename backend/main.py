from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import qrcode
import io
import base64
from PIL import Image
import os
import traceback

app = FastAPI(title="EduCard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentProfile(BaseModel):
    firstName: str
    lastName: str
    university: str
    major: str
    email: str
    phone: str = ""
    portfolio: str = ""

@app.post("/api/generate")
def generate_profile(profile: StudentProfile):
    try:
        # 1. Generate vCard Format
        vcard_data = f"BEGIN:VCARD\nVERSION:3.0\nFN:{profile.firstName} {profile.lastName}\nORG:{profile.university}\nTITLE:{profile.major}\nEMAIL:{profile.email}\nTEL:{profile.phone}\nURL:{profile.portfolio}\nEND:VCARD"
        
        # 2. Generate QR Code containing the vCard with High error correction
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(vcard_data)
        qr.make(fit=True)
        
        # Create image, ensure it is RGB
        qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
        
        # 3. Add Logo to Center
        # Use absolute path to ensure accurate resolution regardless of CWD
        logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "LOGO.png")
        if os.path.exists(logo_path):
            logo = Image.open(logo_path)
            
            # Calculate size for logo (e.g., 20% of QR code width)
            basewidth = int(float(qr_img.size[0]) * 0.22)
            wpercent = (basewidth / float(logo.size[0]))
            hsize = int((float(logo.size[1]) * float(wpercent)))
            logo = logo.resize((basewidth, hsize), Image.Resampling.LANCZOS)
            
            # Calculate center position
            pos = ((qr_img.size[0] - logo.size[0]) // 2, (qr_img.size[1] - logo.size[1]) // 2)
            
            # Handle transparency mask
            if logo.mode in ('RGBA', 'LA') or (logo.mode == 'P' and 'transparency' in logo.info):
                qr_img.paste(logo, pos, logo)
            else:
                qr_img.paste(logo, pos)
        
        # 4. Convert image to base64 for frontend consumption
        buffered = io.BytesIO()
        qr_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {
            "status": "success",
            "vcard_raw": vcard_data,
            "qr_code": f"data:image/png;base64,{img_str}"
        }
    except Exception as e:
        err = traceback.format_exc()
        print(err)
        return {"status": "error", "message": str(e), "traceback": err}

@app.get("/")
def health_check():
    return {"status": "System Online", "latency": "ok"}
