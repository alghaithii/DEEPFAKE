"""
Comprehensive Backend API Tests for TruthLens Deepfake Detection Platform
Tests: Auth, File Upload (Image/Video/Audio), Analysis History, PDF Reports, Sharing
New in this iteration: Video thumbnail generation, Audio waveform visualization, media_duration
"""
import pytest
import requests
import os
import time
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://forensic-scan-1.preview.emergentagent.com"

# Test user credentials
TEST_USER_EMAIL = f"test_video_audio_{int(time.time())}@test.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_NAME = "Test User Video Audio"


class TestAuth:
    """Authentication endpoint tests"""
    token = None
    
    def test_01_register_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": TEST_USER_NAME,
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEST_USER_EMAIL
        TestAuth.token = data["token"]
        print(f"✓ User registered: {TEST_USER_EMAIL}")
    
    def test_02_login_user(self):
        """Test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        TestAuth.token = data["token"]
        print("✓ User login successful")
    
    def test_03_get_me(self):
        """Test get current user"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        print("✓ Get current user successful")
    
    def test_04_invalid_login(self):
        """Test invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should return 401 for invalid credentials"
        print("✓ Invalid login correctly rejected")


class TestImageUpload:
    """Test image file upload and analysis"""
    analysis_id = None
    
    def test_01_upload_image(self):
        """Test image upload returns analysis with preview"""
        with open('/tmp/test_image.jpg', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/analysis/upload",
                files={"file": ("test_image.jpg", f, "image/jpeg")},
                data={"language": "en"},
                headers={"authorization": f"Bearer {TestAuth.token}"},
                timeout=60
            )
        assert response.status_code == 200, f"Image upload failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "No analysis ID in response"
        assert data["file_type"] == "image", f"Wrong file_type: {data.get('file_type')}"
        assert "verdict" in data, "No verdict in response"
        assert "confidence" in data, "No confidence in response"
        assert "preview" in data, "No preview in response for image"
        assert data.get("preview_type") == "image", f"Wrong preview_type: {data.get('preview_type')}"
        assert data.get("media_duration") is None, "Image should not have media_duration"
        
        TestImageUpload.analysis_id = data["id"]
        print(f"✓ Image uploaded - verdict: {data['verdict']}, confidence: {data['confidence']}%")
    
    def test_02_get_image_analysis(self):
        """Verify image analysis can be retrieved with all fields"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/{TestImageUpload.analysis_id}",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get analysis failed: {response.text}"
        data = response.json()
        
        assert data["file_type"] == "image"
        assert data.get("preview_type") == "image"
        assert "preview" in data
        assert "details" in data
        print(f"✓ Image analysis retrieved - has preview: {bool(data.get('preview'))}")


class TestVideoUpload:
    """Test video file upload with thumbnail and duration"""
    analysis_id = None
    
    def test_01_upload_video(self):
        """Test video upload returns analysis with video_thumb preview and duration"""
        with open('/tmp/test_video.mp4', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/analysis/upload",
                files={"file": ("test_video.mp4", f, "video/mp4")},
                data={"language": "en"},
                headers={"authorization": f"Bearer {TestAuth.token}"},
                timeout=90  # Video analysis may take longer
            )
        assert response.status_code == 200, f"Video upload failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "No analysis ID in response"
        assert data["file_type"] == "video", f"Wrong file_type: {data.get('file_type')}"
        assert "verdict" in data, "No verdict in response"
        assert "confidence" in data, "No confidence in response"
        
        # NEW: Verify video-specific fields
        assert data.get("preview_type") == "video_thumb", f"Expected preview_type='video_thumb', got {data.get('preview_type')}"
        assert data.get("preview") is not None, "Video should have thumbnail preview"
        assert data.get("media_duration") is not None, "Video should have media_duration"
        assert isinstance(data["media_duration"], (int, float)), "media_duration should be numeric"
        
        TestVideoUpload.analysis_id = data["id"]
        print(f"✓ Video uploaded - verdict: {data['verdict']}, duration: {data['media_duration']}s, preview_type: {data['preview_type']}")
    
    def test_02_get_video_analysis(self):
        """Verify video analysis can be retrieved with preview_type and media_duration"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/{TestVideoUpload.analysis_id}",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get video analysis failed: {response.text}"
        data = response.json()
        
        assert data["file_type"] == "video"
        assert data.get("preview_type") == "video_thumb", f"Expected video_thumb, got {data.get('preview_type')}"
        assert data.get("media_duration") is not None, "Missing media_duration"
        assert "preview" in data and data["preview"], "Missing or empty preview"
        print(f"✓ Video analysis retrieved - duration: {data['media_duration']}s")


class TestAudioUpload:
    """Test audio file upload with waveform visualization and duration"""
    analysis_id = None
    
    def test_01_upload_audio(self):
        """Test audio upload returns analysis with audio_waveform preview and duration"""
        with open('/tmp/test_audio.wav', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/analysis/upload",
                files={"file": ("test_audio.wav", f, "audio/wav")},
                data={"language": "en"},
                headers={"authorization": f"Bearer {TestAuth.token}"},
                timeout=90  # Audio analysis may take longer
            )
        assert response.status_code == 200, f"Audio upload failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "No analysis ID in response"
        assert data["file_type"] == "audio", f"Wrong file_type: {data.get('file_type')}"
        assert "verdict" in data, "No verdict in response"
        assert "confidence" in data, "No confidence in response"
        
        # NEW: Verify audio-specific fields
        assert data.get("preview_type") == "audio_waveform", f"Expected preview_type='audio_waveform', got {data.get('preview_type')}"
        assert data.get("preview") is not None, "Audio should have waveform preview"
        assert data.get("media_duration") is not None, "Audio should have media_duration"
        assert isinstance(data["media_duration"], (int, float)), "media_duration should be numeric"
        
        TestAudioUpload.analysis_id = data["id"]
        print(f"✓ Audio uploaded - verdict: {data['verdict']}, duration: {data['media_duration']}s, preview_type: {data['preview_type']}")
    
    def test_02_get_audio_analysis(self):
        """Verify audio analysis can be retrieved with preview_type and media_duration"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/{TestAudioUpload.analysis_id}",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get audio analysis failed: {response.text}"
        data = response.json()
        
        assert data["file_type"] == "audio"
        assert data.get("preview_type") == "audio_waveform", f"Expected audio_waveform, got {data.get('preview_type')}"
        assert data.get("media_duration") is not None, "Missing media_duration"
        assert "preview" in data and data["preview"], "Missing or empty waveform preview"
        print(f"✓ Audio analysis retrieved - duration: {data['media_duration']}s")


class TestAnalysisHistory:
    """Test analysis history endpoint with all media types"""
    
    def test_01_get_history(self):
        """Test history returns all analyses with correct types"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/history",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get history failed: {response.text}"
        data = response.json()
        
        assert "analyses" in data, "No analyses array in response"
        assert "total" in data, "No total count in response"
        assert data["total"] >= 3, f"Expected at least 3 analyses (image, video, audio), got {data['total']}"
        
        # Check that we have all media types
        types_found = set(a["file_type"] for a in data["analyses"])
        assert "image" in types_found, "No image analysis in history"
        assert "video" in types_found, "No video analysis in history"
        assert "audio" in types_found, "No audio analysis in history"
        
        print(f"✓ History retrieved - {data['total']} analyses, types: {types_found}")


class TestStats:
    """Test stats endpoint returns correct counts by type"""
    
    def test_01_get_stats(self):
        """Test stats endpoint includes by_type counts"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/stats",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        
        assert "total" in data
        assert "by_type" in data, "Missing by_type stats"
        assert "image" in data["by_type"], "Missing image count"
        assert "video" in data["by_type"], "Missing video count"
        assert "audio" in data["by_type"], "Missing audio count"
        
        assert data["by_type"]["image"] >= 1, "Should have at least 1 image analysis"
        assert data["by_type"]["video"] >= 1, "Should have at least 1 video analysis"
        assert data["by_type"]["audio"] >= 1, "Should have at least 1 audio analysis"
        
        print(f"✓ Stats: total={data['total']}, by_type={data['by_type']}")


class TestPDFReport:
    """Test PDF report generation for different media types"""
    
    def test_01_pdf_report_video(self):
        """Test PDF report generation for video analysis"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/{TestVideoUpload.analysis_id}/report",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"PDF report failed: {response.text}"
        assert "application/pdf" in response.headers.get("content-type", "")
        assert len(response.content) > 1000, "PDF content too small"
        print(f"✓ Video PDF report generated - {len(response.content)} bytes")
    
    def test_02_pdf_report_audio(self):
        """Test PDF report generation for audio analysis"""
        response = requests.get(
            f"{BASE_URL}/api/analysis/{TestAudioUpload.analysis_id}/report",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"PDF report failed: {response.text}"
        assert "application/pdf" in response.headers.get("content-type", "")
        assert len(response.content) > 1000, "PDF content too small"
        print(f"✓ Audio PDF report generated - {len(response.content)} bytes")


class TestShareLink:
    """Test sharing functionality"""
    share_id = None
    
    def test_01_create_share_link(self):
        """Test creating a share link for video analysis"""
        response = requests.post(
            f"{BASE_URL}/api/analysis/{TestVideoUpload.analysis_id}/share",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Create share link failed: {response.text}"
        data = response.json()
        assert "share_id" in data, "No share_id in response"
        TestShareLink.share_id = data["share_id"]
        print(f"✓ Share link created: {data['share_id']}")
    
    def test_02_access_shared_analysis(self):
        """Test accessing shared analysis without authentication"""
        response = requests.get(f"{BASE_URL}/api/shared/{TestShareLink.share_id}")
        assert response.status_code == 200, f"Access shared analysis failed: {response.text}"
        data = response.json()
        assert "verdict" in data
        assert "file_type" in data
        assert data["file_type"] == "video"
        print(f"✓ Shared analysis accessible publicly - verdict: {data['verdict']}")


class TestDeleteAnalysis:
    """Test analysis deletion"""
    
    def test_01_delete_image_analysis(self):
        """Test deleting an analysis"""
        response = requests.delete(
            f"{BASE_URL}/api/analysis/{TestImageUpload.analysis_id}",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        # Verify it's deleted
        get_response = requests.get(
            f"{BASE_URL}/api/analysis/{TestImageUpload.analysis_id}",
            headers={"authorization": f"Bearer {TestAuth.token}"}
        )
        assert get_response.status_code == 404, "Analysis should be deleted"
        print("✓ Analysis deleted successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
