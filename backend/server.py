from fastapi import FastAPI, APIRouter, UploadFile, File, Depends, HTTPException, Form, Header
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import json
import tempfile
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini API key
GEMINI_API_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'deepfake-detector-secret-key-2024')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    language: str = "en"
    created_at: str

class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    file_type: str
    file_name: str
    verdict: str
    confidence: float
    details: dict
    created_at: str

class CompareRequest(BaseModel):
    analysis_ids: List[str]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    return jwt.encode({"user_id": user_id, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7}, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "language": "en",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email, "language": "en", "created_at": user_doc["created_at"]}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "language": user.get("language", "en"), "created_at": user["created_at"]}}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "language": user.get("language", "en"), "created_at": user["created_at"]}

@api_router.put("/auth/language")
async def update_language(language: str = "en", user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {"language": language}})
    return {"message": "Language updated", "language": language}

# ============ ANALYSIS HELPERS ============

def get_mime_type(file_type: str, filename: str) -> str:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    mime_map = {
        'image': {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'},
        'video': {'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo', 'webm': 'video/webm', 'mkv': 'video/x-matroska'},
        'audio': {'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'aac': 'audio/aac', 'flac': 'audio/flac', 'm4a': 'audio/mp4'}
    }
    return mime_map.get(file_type, {}).get(ext, f'{file_type}/{ext}')

def detect_file_type(filename: str) -> str:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if ext in ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic']:
        return 'image'
    elif ext in ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv']:
        return 'video'
    elif ext in ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']:
        return 'audio'
    return 'unknown'

async def analyze_with_gemini(file_path: str, file_type: str, filename: str, language: str = "en") -> dict:
    """Analyze a file using Gemini to detect if it's fake/AI-generated"""
    try:
        lang_instruction = "يجب أن تكون جميع النصوص في الاستجابة باللغة العربية." if language == "ar" else "All text in the response must be in English."

        system_prompt = f"""You are a world-class digital forensics expert specializing in deepfake detection and media authenticity verification. You work at a leading digital forensics laboratory.

CRITICAL ACCURACY RULES:
- You must be HIGHLY ACCURATE. Do NOT flag authentic content as fake.
- Real-world media (photos from phones, real voice recordings, natural videos) should be classified as "authentic" unless there are CLEAR, SPECIFIC signs of manipulation.
- Compression artifacts, slight noise, or format conversion artifacts are NORMAL in real media - they are NOT signs of fakery.
- Audio recorded from microphones naturally has background noise, slight variations in pitch, and breathing sounds - these are signs of AUTHENTICITY, not fakery.
- Only flag as "suspicious" or "likely_fake" when you find CONCRETE evidence of manipulation such as:
  * For images: clear GAN artifacts (grid patterns), impossible geometry, inconsistent lighting physics, clone stamping, splicing boundaries, warped text
  * For video: temporal flickering between frames, face-swap boundary artifacts, lip-sync desynchronization, unnatural head movement physics
  * For audio: robotic pitch uniformity, unnatural spectral gaps, TTS synthesis markers, voice cloning concatenation artifacts, impossible breathing patterns
- When in doubt, lean toward "authentic" with moderate confidence rather than false positives.

{lang_instruction}

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks) with this EXACT structure:
{{
    "verdict": "authentic" or "suspicious" or "likely_fake",
    "confidence": number between 0 and 100,
    "summary": "Comprehensive assessment of the file's authenticity",
    "analysis_stages": [
        {{
            "stage": "stage name (e.g., Metadata Analysis, Structural Analysis, AI Pattern Detection, Spectral Analysis)",
            "status": "pass" or "warning" or "fail",
            "finding": "what was found in this stage"
        }}
    ],
    "indicators": [
        {{
            "name": "indicator name",
            "description": "detailed description of finding",
            "severity": "low" or "medium" or "high",
            "category": "metadata" or "structural" or "ai_pattern" or "temporal" or "spectral" or "behavioral"
        }}
    ],
    "technical_details": {{
        "artifacts_found": ["list of specific artifacts"],
        "consistency_score": number 0-100,
        "metadata_analysis": "detailed metadata findings",
        "format_info": "file format and encoding details",
        "quality_assessment": "quality and compression analysis"
    }},
    "forensic_notes": "detailed technical forensic observations for experts",
    "recommendation": "clear actionable recommendation for the user"
}}

ANALYSIS METHODOLOGY by file type:
- For images: Check EXIF metadata integrity, Error Level Analysis patterns, noise consistency, lighting physics, edge coherence, facial geometry, texture frequency analysis, compression artifact patterns
- For video: Frame-by-frame temporal consistency, motion flow analysis, audio-visual synchronization, codec artifact analysis, temporal noise patterns, facial landmark tracking consistency
- For audio: Spectral analysis across frequency bands, pitch contour naturalness, formant transition smoothness, background noise consistency, energy envelope analysis, voice quality metrics"""

        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"analysis-{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.0-flash")

        mime_type = get_mime_type(file_type, filename)
        file_content = FileContentWithMimeType(file_path=file_path, mime_type=mime_type)

        analysis_instruction = {
            'image': f"Perform a comprehensive forensic analysis of this image file '{filename}'. Examine metadata, pixel-level patterns, structural consistency, and AI generation markers. Be accurate - do not flag natural photos as fake.",
            'video': f"Perform a comprehensive forensic analysis of this video file '{filename}'. Examine temporal consistency, frame coherence, audio-visual sync, and deepfake markers. Be accurate - do not flag natural recordings as fake.",
            'audio': f"Perform a comprehensive forensic analysis of this audio file '{filename}'. Examine spectral patterns, pitch naturalness, voice characteristics, background noise consistency, and synthesis markers. Be accurate - real recordings have natural imperfections like breathing, pauses, and ambient noise which are signs of authenticity."
        }

        user_msg = UserMessage(
            text=analysis_instruction.get(file_type, f"Analyze this {file_type} file for authenticity."),
            file_contents=[file_content]
        )

        response = await chat.send_message(user_msg)
        response_text = str(response)

        # Clean markdown code blocks if present
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()

        result = json.loads(response_text)
        
        # Ensure all required fields exist
        result.setdefault("analysis_stages", [])
        result.setdefault("forensic_notes", "")
        result.setdefault("indicators", [])
        result.setdefault("technical_details", {"artifacts_found": [], "consistency_score": 50, "metadata_analysis": "N/A", "format_info": "N/A", "quality_assessment": "N/A"})
        
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}, response: {response_text[:500] if 'response_text' in dir() else 'N/A'}")
        return {
            "verdict": "suspicious",
            "confidence": 50,
            "summary": "تعذر تحليل النتائج بالكامل. يُنصح بالمراجعة اليدوية." if language == "ar" else "Analysis completed but results could not be fully parsed. Manual review recommended.",
            "analysis_stages": [{"stage": "AI Analysis", "status": "warning", "finding": "Partial results"}],
            "indicators": [{"name": "Parse Error", "description": "AI response format issue", "severity": "low", "category": "metadata"}],
            "technical_details": {"artifacts_found": [], "consistency_score": 50, "metadata_analysis": "Partial", "format_info": "N/A", "quality_assessment": "N/A"},
            "forensic_notes": "",
            "recommendation": "أعد تحميل الملف لمحاولة تحليل أخرى." if language == "ar" else "Re-upload the file for another analysis attempt."
        }
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ============ ANALYSIS ROUTES ============

@api_router.post("/analysis/upload")
async def upload_and_analyze(
    file: UploadFile = File(...),
    language: str = Form("en"),
    authorization: Optional[str] = Header(None)
):
    user = await get_current_user(authorization)
    file_type = detect_file_type(file.filename)
    if file_type == 'unknown':
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Analyze with Gemini
        result = await analyze_with_gemini(tmp_path, file_type, file.filename, language)

        # Store analysis
        analysis_id = str(uuid.uuid4())
        analysis_doc = {
            "id": analysis_id,
            "user_id": user["id"],
            "file_type": file_type,
            "file_name": file.filename,
            "file_size": len(content),
            "verdict": result.get("verdict", "unknown"),
            "confidence": float(result.get("confidence", 0)),
            "details": result,
            "language": language,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.analyses.insert_one(analysis_doc)

        return {
            "id": analysis_id,
            "user_id": user["id"],
            "file_type": file_type,
            "file_name": file.filename,
            "file_size": len(content),
            "verdict": result.get("verdict", "unknown"),
            "confidence": float(result.get("confidence", 0)),
            "details": result,
            "created_at": analysis_doc["created_at"]
        }
    finally:
        os.unlink(tmp_path)

@api_router.get("/analysis/history")
async def get_history(limit: int = 50, skip: int = 0, user: dict = Depends(get_current_user)):
    analyses = await db.analyses.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.analyses.count_documents({"user_id": user["id"]})
    return {"analyses": analyses, "total": total}

@api_router.get("/analysis/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    total = await db.analyses.count_documents({"user_id": user["id"]})
    authentic = await db.analyses.count_documents({"user_id": user["id"], "verdict": "authentic"})
    suspicious = await db.analyses.count_documents({"user_id": user["id"], "verdict": "suspicious"})
    fake = await db.analyses.count_documents({"user_id": user["id"], "verdict": "likely_fake"})

    # Get recent by type
    images = await db.analyses.count_documents({"user_id": user["id"], "file_type": "image"})
    videos = await db.analyses.count_documents({"user_id": user["id"], "file_type": "video"})
    audios = await db.analyses.count_documents({"user_id": user["id"], "file_type": "audio"})

    return {
        "total": total,
        "authentic": authentic,
        "suspicious": suspicious,
        "likely_fake": fake,
        "by_type": {"image": images, "video": videos, "audio": audios}
    }

@api_router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    analysis = await db.analyses.find_one({"id": analysis_id, "user_id": user["id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@api_router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    result = await db.analyses.delete_one({"id": analysis_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Analysis deleted"}

@api_router.post("/analysis/compare")
async def compare_analyses(data: CompareRequest, user: dict = Depends(get_current_user)):
    analyses = []
    for aid in data.analysis_ids:
        a = await db.analyses.find_one({"id": aid, "user_id": user["id"]}, {"_id": 0})
        if a:
            analyses.append(a)
    if len(analyses) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 analyses to compare")
    return {"analyses": analyses}

@api_router.get("/analysis/{analysis_id}/report")
async def generate_report(analysis_id: str, user: dict = Depends(get_current_user)):
    analysis = await db.analyses.find_one({"id": analysis_id, "user_id": user["id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import arabic_reshaper
    from bidi.algorithm import get_display

    is_arabic = analysis.get("language", "en") == "ar"

    def shape_ar(text):
        """Reshape Arabic text for proper PDF rendering"""
        if not is_arabic or not text:
            return str(text)
        try:
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        except Exception:
            return str(text)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=24, textColor=colors.HexColor('#1A1A18'),
                                  alignment=2 if is_arabic else 0)
    normal_ar = ParagraphStyle('NormalAr', parent=styles['Normal'], alignment=2 if is_arabic else 0, fontSize=11, leading=16)
    heading_ar = ParagraphStyle('HeadingAr', parent=styles['Heading2'], alignment=2 if is_arabic else 0)

    # Title
    title = shape_ar("تقرير تحليل المصداقية الرقمية") if is_arabic else "Digital Authenticity Analysis Report"
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("TruthLens Forensic Report", ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#858580'), alignment=2 if is_arabic else 0)))
    elements.append(Spacer(1, 20))

    # Verdict badge
    verdict = analysis.get("verdict", "unknown")
    verdict_color = {'authentic': '#2F855A', 'suspicious': '#C05621', 'likely_fake': '#C53030'}.get(verdict, '#858580')
    verdict_labels = {
        'authentic': shape_ar('أصلي') if is_arabic else 'AUTHENTIC',
        'suspicious': shape_ar('مشبوه') if is_arabic else 'SUSPICIOUS',
        'likely_fake': shape_ar('مزيف على الأرجح') if is_arabic else 'LIKELY FAKE'
    }
    verdict_style = ParagraphStyle('Verdict', parent=styles['Title'], fontSize=18, textColor=colors.HexColor(verdict_color), alignment=1)
    elements.append(Paragraph(f"{verdict_labels.get(verdict, verdict.upper())} — {analysis.get('confidence', 0)}%", verdict_style))
    elements.append(Spacer(1, 20))

    # File info table
    fn_label = shape_ar("اسم الملف") if is_arabic else "File Name"
    ft_label = shape_ar("نوع الملف") if is_arabic else "File Type"
    dt_label = shape_ar("تاريخ التحليل") if is_arabic else "Analysis Date"
    vd_label = shape_ar("الحكم") if is_arabic else "Verdict"
    cf_label = shape_ar("مستوى الثقة") if is_arabic else "Confidence"
    
    info_data = [
        [fn_label, analysis.get("file_name", "N/A")],
        [ft_label, analysis.get("file_type", "N/A")],
        [dt_label, analysis.get("created_at", "N/A")],
        [vd_label, verdict_labels.get(verdict, verdict)],
        [cf_label, f"{analysis.get('confidence', 0)}%"]
    ]
    info_table = Table(info_data, colWidths=[150, 350])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1A1A18')),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DADAD5')),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT' if is_arabic else 'LEFT'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    details = analysis.get("details", {})

    # Summary
    summary_title = shape_ar("الملخص") if is_arabic else "Summary"
    elements.append(Paragraph(summary_title, heading_ar))
    summary_text = details.get("summary", "N/A")
    elements.append(Paragraph(shape_ar(summary_text) if is_arabic else summary_text, normal_ar))
    elements.append(Spacer(1, 15))

    # Analysis Stages
    stages = details.get("analysis_stages", [])
    if stages:
        stages_title = shape_ar("مراحل التحليل") if is_arabic else "Analysis Stages"
        elements.append(Paragraph(stages_title, heading_ar))
        for stage in stages:
            status_icon = {'pass': '[OK]', 'warning': '[!]', 'fail': '[X]'}.get(stage.get('status', ''), '[?]')
            status_color = {'pass': '#2F855A', 'warning': '#C05621', 'fail': '#C53030'}.get(stage.get('status', ''), '#858580')
            stage_text = f"{status_icon} <b>{shape_ar(stage.get('stage', '')) if is_arabic else stage.get('stage', '')}</b>: {shape_ar(stage.get('finding', '')) if is_arabic else stage.get('finding', '')}"
            elements.append(Paragraph(stage_text, ParagraphStyle('Stage', parent=normal_ar, textColor=colors.HexColor(status_color))))
            elements.append(Spacer(1, 5))
        elements.append(Spacer(1, 10))

    # Indicators
    indicators = details.get("indicators", [])
    if indicators:
        ind_title = shape_ar("المؤشرات المكتشفة") if is_arabic else "Detection Indicators"
        elements.append(Paragraph(ind_title, heading_ar))
        for ind in indicators:
            severity_color = {'high': '#C53030', 'medium': '#C05621', 'low': '#2F855A'}.get(ind.get('severity', 'low'), '#575752')
            ind_name = shape_ar(ind.get('name', 'N/A')) if is_arabic else ind.get('name', 'N/A')
            ind_desc = shape_ar(ind.get('description', '')) if is_arabic else ind.get('description', '')
            elements.append(Paragraph(f"<b>{ind_name}</b> [{ind.get('severity', 'N/A').upper()}]", ParagraphStyle('Indicator', parent=normal_ar, textColor=colors.HexColor(severity_color))))
            elements.append(Paragraph(ind_desc, normal_ar))
            elements.append(Spacer(1, 8))

    # Forensic Notes
    forensic_notes = details.get("forensic_notes", "")
    if forensic_notes:
        fn_title = shape_ar("ملاحظات جنائية") if is_arabic else "Forensic Notes"
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(fn_title, heading_ar))
        elements.append(Paragraph(shape_ar(forensic_notes) if is_arabic else forensic_notes, normal_ar))

    # Recommendation
    rec = details.get("recommendation", "")
    if rec:
        elements.append(Spacer(1, 10))
        rec_title = shape_ar("التوصية") if is_arabic else "Recommendation"
        elements.append(Paragraph(rec_title, heading_ar))
        elements.append(Paragraph(shape_ar(rec) if is_arabic else rec, normal_ar))

    # Footer
    elements.append(Spacer(1, 30))
    footer_text = shape_ar("تم إنشاء هذا التقرير بواسطة TruthLens - منصة كشف التزييف العميق") if is_arabic else "Generated by TruthLens - AI-Powered Deepfake Detection Platform"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#858580'), alignment=1)))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=truthlens-report-{analysis_id[:8]}.pdf"}
    )

# ============ GENERAL ============

@api_router.get("/")
async def root():
    return {"message": "Deepfake Detector API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
