from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import qrcode
import io
import base64

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
    # 1. Generate vCard Format
    vcard_data = f"BEGIN:VCARD\nVERSION:3.0\nFN:{profile.firstName} {profile.lastName}\nORG:{profile.university}\nTITLE:{profile.major}\nEMAIL:{profile.email}\nTEL:{profile.phone}\nURL:{profile.portfolio}\nEND:VCARD"
    
    # 2. Generate QR Code containing the vCard
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(vcard_data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 3. Convert image to base64 for frontend consumption
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {
        "status": "success",
        "vcard_raw": vcard_data,
        "qr_code": f"data:image/png;base64,{img_str}"
    }

@app.get("/")
def health_check():
    return {"status": "System Online", "latency": "ok"}
