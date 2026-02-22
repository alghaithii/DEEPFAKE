# TruthLens - Deepfake Detection Platform PRD

## Original Problem Statement
بناء موقع لاكتشاف الصور ومقاطع الفيديو المزيفة أو مقاطع الصوت بطريقة ابتكارية (Build an innovative website for detecting fake images, videos, and audio)

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: Gemini 2.0 Flash via emergentintegrations (Emergent LLM Key)
- **Auth**: JWT with bcrypt
- **Reports**: ReportLab PDF generation with Pillow for image annotations
- **Media Processing**: FFmpeg for video thumbnails/audio waveforms

## User Personas
1. **Journalists**: Verify media authenticity before publishing
2. **Fact-checkers**: Analyze viral content for manipulation
3. **Security researchers**: Study deepfake techniques
4. **General public**: Protect themselves from misinformation

## Core Requirements
- Multi-format analysis (images, video, audio)
- AI-powered deepfake detection with confidence scores
- Bilingual support (Arabic/English with RTL)
- Analysis history and management
- Side-by-side comparison
- PDF report generation with visual annotations
- User authentication
- Public sharing of results

## What's Been Implemented (Feb 2026)
- [x] JWT authentication (register/login)
- [x] Landing page with hero, features, how-it-works sections
- [x] File upload with drag & drop (images, video, audio)
- [x] **Dual-Pass AI Analysis** - Pass 1: neutral observation, Pass 2: forensic verdict
- [x] **Image Analysis** - Full image deepfake detection with annotations
- [x] **Video Analysis** - Video deepfake detection with thumbnail preview and duration
- [x] **Audio Analysis** - Audio deepfake detection with waveform visualization and duration
- [x] **Video Thumbnails** - FFmpeg-based frame extraction for video previews
- [x] **Audio Waveform** - PIL-based waveform visualization for audio
- [x] **Media Duration** - FFprobe-based duration extraction
- [x] **Image Annotations** - Visual markers on images showing exactly where issues are found
- [x] **URL Analysis** - Paste any image/video/audio URL to analyze directly
- [x] **Public Share Links** - Share analysis results via public link
- [x] **Arabic AI Responses** - Full Arabic text in analysis when language=ar
- [x] **Arabic PDF Reports** - RTL-supported PDF with arabic-reshaper
- [x] **Enhanced PDF Reports** - Annotated images with drawn markers, annotation details, duration info
- [x] **Forensic Analysis Pipeline** - 6-stage visualization with real-time progress
- [x] **Confidence Gauge** - SVG semi-circle gauge visualization
- [x] **Forensic Notes** - Advanced technical forensic observations section
- [x] **Indicator Categories** - metadata, structural, ai_pattern, temporal, spectral, behavioral
- [x] Dashboard with stats (total, by type, by verdict)
- [x] Analysis history with search and type filters
- [x] Analysis detail page with full breakdown
- [x] Side-by-side comparison page
- [x] PDF report generation and download (Arabic + English)
- [x] Settings page with language toggle
- [x] Bilingual Arabic/English with RTL support
- [x] Mobile responsive design
- [x] "Digital Clay" beige theme design
- [x] Shared analysis public page

## Prioritized Backlog
### P0 (Critical) - All completed
### P1 (Important)
- [ ] Batch file upload (analyze multiple files at once)
- [ ] Analysis result caching for duplicate files
- [ ] Social sharing of analysis results (Twitter, WhatsApp)
### P2 (Nice to have)
- [ ] Real-time collaboration on analyses
- [ ] API rate limiting and usage tracking
- [ ] File hash comparison for known fakes database
- [ ] Chrome extension for in-browser analysis
- [ ] Webhook notifications for completed analyses
- [ ] Backend modularization (split server.py into routes/services/models)

## Key API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/analysis/upload` - Analyze uploaded file (image/video/audio)
- `POST /api/analysis/url` - Analyze file from URL
- `GET /api/analysis/{id}` - Get analysis detail
- `GET /api/analysis/history` - Get user's analysis history
- `GET /api/analysis/stats` - Get user's analysis statistics
- `GET /api/analysis/{id}/report` - Generate PDF report
- `POST /api/analysis/{id}/share` - Create share link
- `GET /api/shared/{share_id}` - Get shared analysis (public)
- `POST /api/analysis/compare` - Compare multiple analyses
- `DELETE /api/analysis/{id}` - Delete analysis

## DB Schema
- **users**: `{id, name, email, password_hash, language, created_at}`
- **analyses**: `{id, user_id, file_type, file_name, file_size, verdict, confidence, details, language, preview, preview_type, media_duration, share_id, created_at}`
