#!/usr/bin/env python3

import requests
import sys
import json
import tempfile
import os
from datetime import datetime

class DeepfakeDetectorAPITester:
    def __init__(self, base_url="https://deepfake-detector-65.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, response_code=None, details=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "status": "PASS" if success else "FAIL",
            "response_code": response_code,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name} - {response_code} - {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        
        # Add authorization as Bearer header (standard method)
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        query_params = {}
        if params:
            query_params.update(params)
        
        if headers:
            default_headers.update(headers)
        
        # Remove content-type for file uploads
        if files and 'Content-Type' in default_headers:
            del default_headers['Content-Type']

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if self.token:
            print(f"   Auth: Bearer {self.token[:20]}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=query_params)
            elif method == 'POST':
                if files:
                    # For file uploads, use form data with Authorization header
                    response = requests.post(url, data=data, files=files, headers=default_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers, params=query_params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, params=query_params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, params=query_params)
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = response.text[:200] + "..." if len(response.text) > 200 else response.text
            
            self.log_test(name, success, response.status_code, 
                         f"Expected {expected_status}" + (f", got response: {str(response_data)[:100]}" if not success else ""))
            
            return success, response_data if isinstance(response_data, dict) else {}

        except Exception as e:
            self.log_test(name, False, "ERROR", f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET", 
            "", 
            200
        )
        return success

    def test_register_new_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S%f')
        test_user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "test123456"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   ✓ Got token: {self.token[:20]}...")
            print(f"   ✓ Got user ID: {self.user_id}")
        
        return success

    def test_login_existing_user(self):
        """Test login with existing test user"""
        login_data = {
            "email": "test@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "User Login (existing test user)",
            "POST",
            "auth/login", 
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   ✓ Logged in successfully")
        
        return success

    def test_get_current_user(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_analysis_stats(self):
        """Test get analysis statistics"""
        success, response = self.run_test(
            "Get Analysis Stats",
            "GET",
            "analysis/stats",
            200
        )
        return success

    def test_get_analysis_history(self):
        """Test get analysis history"""
        success, response = self.run_test(
            "Get Analysis History",
            "GET",
            "analysis/history",
            200
        )
        return success

    def test_file_upload_analysis_english(self):
        """Test file upload and analysis with English language"""
        try:
            # Create a proper test image using PIL
            from PIL import Image
            import io
            
            # Create a simple red image
            img = Image.new('RGB', (100, 100), color='red')
            buf = io.BytesIO()
            img.save(buf, format='JPEG')
            buf.seek(0)
            
            files = {'file': ('test_red_image_en.jpg', buf, 'image/jpeg')}
            data = {'language': 'en'}
            
            success, response = self.run_test(
                "File Upload & Analysis (English)",
                "POST",
                "analysis/upload",
                200,
                data=data,
                files=files
            )
            
            if success:
                self.analysis_id_en = response.get('id')
                details = response.get('details', {})
                print(f"   ✓ Analysis ID: {self.analysis_id_en}")
                print(f"   ✓ Verdict: {response.get('verdict')}")
                print(f"   ✓ Confidence: {response.get('confidence')}%")
                print(f"   ✓ Language: {response.get('language', 'N/A')}")
                
                # Check new fields from iteration 3
                has_stages = bool(details.get('analysis_stages'))
                has_forensic = bool(details.get('forensic_notes'))
                has_format_info = bool(details.get('technical_details', {}).get('format_info'))
                has_quality = bool(details.get('technical_details', {}).get('quality_assessment'))
                
                print(f"   ✓ Has analysis_stages: {has_stages}")
                print(f"   ✓ Has forensic_notes: {has_forensic}")
                print(f"   ✓ Has format_info: {has_format_info}")
                print(f"   ✓ Has quality_assessment: {has_quality}")
                
                # Verify English text
                summary = details.get('summary', '')
                is_english = any(word in summary.lower() for word in ['the', 'and', 'is', 'analysis', 'image']) if summary else False
                print(f"   ✓ Summary appears to be in English: {is_english}")
            
            return success
                
        except Exception as e:
            print(f"   ❌ Exception during file upload: {str(e)}")
            return False

    def test_file_upload_analysis_arabic(self):
        """Test file upload and analysis with Arabic language"""
        try:
            # Create a proper test image using PIL
            from PIL import Image
            import io
            
            # Create a simple blue image
            img = Image.new('RGB', (100, 100), color='blue')
            buf = io.BytesIO()
            img.save(buf, format='JPEG')
            buf.seek(0)
            
            files = {'file': ('test_blue_image_ar.jpg', buf, 'image/jpeg')}
            data = {'language': 'ar'}
            
            success, response = self.run_test(
                "File Upload & Analysis (Arabic)",
                "POST",
                "analysis/upload",
                200,
                data=data,
                files=files
            )
            
            if success:
                self.analysis_id_ar = response.get('id')
                details = response.get('details', {})
                print(f"   ✓ Analysis ID: {self.analysis_id_ar}")
                print(f"   ✓ Verdict: {response.get('verdict')}")
                print(f"   ✓ Confidence: {response.get('confidence')}%")
                print(f"   ✓ Language: {response.get('language', 'N/A')}")
                
                # Check new fields from iteration 3
                has_stages = bool(details.get('analysis_stages'))
                has_forensic = bool(details.get('forensic_notes'))
                has_format_info = bool(details.get('technical_details', {}).get('format_info'))
                has_quality = bool(details.get('technical_details', {}).get('quality_assessment'))
                
                print(f"   ✓ Has analysis_stages: {has_stages}")
                print(f"   ✓ Has forensic_notes: {has_forensic}")
                print(f"   ✓ Has format_info: {has_format_info}")
                print(f"   ✓ Has quality_assessment: {has_quality}")
                
                # Verify Arabic text (basic check for Arabic characters)
                summary = details.get('summary', '')
                recommendation = details.get('recommendation', '')
                has_arabic_chars = any('\u0600' <= char <= '\u06FF' for char in summary + recommendation)
                print(f"   ✓ Response contains Arabic characters: {has_arabic_chars}")
                
                # Sample some fields for Arabic content verification
                if details.get('indicators'):
                    first_indicator = details['indicators'][0] if details['indicators'] else {}
                    ind_name = first_indicator.get('name', '')
                    has_arabic_indicators = any('\u0600' <= char <= '\u06FF' for char in ind_name)
                    print(f"   ✓ Indicators contain Arabic text: {has_arabic_indicators}")
            
            return success
                
        except Exception as e:
            print(f"   ❌ Exception during file upload: {str(e)}")
            return False

    def test_get_specific_analysis_english(self):
        """Test getting a specific English analysis by ID"""
        if not hasattr(self, 'analysis_id_en') or not self.analysis_id_en:
            print("   ⚠️ No English analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Specific Analysis (English)",
            "GET",
            f"analysis/{self.analysis_id_en}",
            200
        )
        
        if success:
            details = response.get('details', {})
            # Verify all new iteration 3 fields are present
            required_fields = ['analysis_stages', 'forensic_notes']
            tech_fields = ['format_info', 'quality_assessment']
            
            missing_fields = []
            for field in required_fields:
                if not details.get(field):
                    missing_fields.append(field)
            
            tech_details = details.get('technical_details', {})
            for field in tech_fields:
                if not tech_details.get(field):
                    missing_fields.append(f'technical_details.{field}')
            
            if missing_fields:
                print(f"   ⚠️ Missing fields: {missing_fields}")
            else:
                print(f"   ✓ All iteration 3 fields present")
        
        return success

    def test_get_specific_analysis_arabic(self):
        """Test getting a specific Arabic analysis by ID"""
        if not hasattr(self, 'analysis_id_ar') or not self.analysis_id_ar:
            print("   ⚠️ No Arabic analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Specific Analysis (Arabic)",
            "GET",
            f"analysis/{self.analysis_id_ar}",
            200
        )
        return success

    def test_generate_pdf_report_english(self):
        """Test PDF report generation for English analysis"""
        if not hasattr(self, 'analysis_id_en') or not self.analysis_id_en:
            print("   ⚠️ No English analysis ID available, skipping test")
            return False
            
        print(f"\n🔍 Testing PDF Report Generation (English)...")
        url = f"{self.api_url}/analysis/{self.analysis_id_en}/report"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = requests.get(url, headers=headers)
            success = response.status_code == 200 and 'application/pdf' in response.headers.get('content-type', '')
            
            self.log_test("PDF Report Generation (English)", success, response.status_code,
                         "PDF content received" if success else f"Expected PDF, got {response.headers.get('content-type')}")
            return success
            
        except Exception as e:
            self.log_test("PDF Report Generation (English)", False, "ERROR", f"Exception: {str(e)}")
            return False

    def test_generate_pdf_report_arabic(self):
        """Test PDF report generation for Arabic analysis"""
        if not hasattr(self, 'analysis_id_ar') or not self.analysis_id_ar:
            print("   ⚠️ No Arabic analysis ID available, skipping test")
            return False
            
        print(f"\n🔍 Testing PDF Report Generation (Arabic)...")
        url = f"{self.api_url}/analysis/{self.analysis_id_ar}/report"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = requests.get(url, headers=headers)
            success = response.status_code == 200 and 'application/pdf' in response.headers.get('content-type', '')
            
            self.log_test("PDF Report Generation (Arabic)", success, response.status_code,
                         "PDF content received" if success else f"Expected PDF, got {response.headers.get('content-type')}")
            return success
            
        except Exception as e:
            self.log_test("PDF Report Generation (Arabic)", False, "ERROR", f"Exception: {str(e)}")
            return False

    def test_delete_analysis(self):
        """Test deleting an analysis"""
        if not hasattr(self, 'analysis_id') or not self.analysis_id:
            print("   ⚠️ No analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Delete Analysis",
            "DELETE",
            f"analysis/{self.analysis_id}",
            200
        )
        return success

    def test_url_analysis(self):
        """Test URL-based analysis (NEW in iteration 4)"""
        url_data = {
            "url": "https://thispersondoesnotexist.com/",
            "language": "en"
        }
        
        success, response = self.run_test(
            "URL Analysis",
            "POST",
            "analysis/url",
            200,
            data=url_data
        )
        
        if success:
            self.url_analysis_id = response.get('id')
            details = response.get('details', {})
            print(f"   ✓ URL Analysis ID: {self.url_analysis_id}")
            print(f"   ✓ Verdict: {response.get('verdict')}")
            print(f"   ✓ Confidence: {response.get('confidence')}%")
            
            # Check for new iteration 4 fields
            has_annotations = bool(details.get('annotations'))
            has_preview = bool(response.get('preview'))
            
            print(f"   ✓ Has annotations: {has_annotations}")
            print(f"   ✓ Has preview: {has_preview}")
            
        return success

    def test_create_share_link(self):
        """Test creating share link for analysis (NEW in iteration 4)"""
        if not hasattr(self, 'analysis_id_en') or not self.analysis_id_en:
            print("   ⚠️ No English analysis ID available, skipping test")
            return False
        
        success, response = self.run_test(
            "Create Share Link",
            "POST",
            f"analysis/{self.analysis_id_en}/share",
            200
        )
        
        if success:
            self.share_id = response.get('share_id')
            print(f"   ✓ Share ID: {self.share_id}")
            
        return success

    def test_get_shared_analysis(self):
        """Test accessing shared analysis without auth (NEW in iteration 4)"""
        # Test with known share_id from credentials
        test_share_id = "8b3ac93c7311"
        
        # Temporarily remove token for public access test
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            f"Get Shared Analysis (public - {test_share_id})",
            "GET",
            f"shared/{test_share_id}",
            200
        )
        
        # Restore token
        self.token = temp_token
        
        if success:
            print(f"   ✓ Public access successful")
            print(f"   ✓ File name: {response.get('file_name')}")
            print(f"   ✓ Verdict: {response.get('verdict')}")
            
            # Verify sensitive data is removed
            has_user_id = 'user_id' in response
            has_preview = 'preview' in response
            print(f"   ✓ user_id hidden: {not has_user_id}")
            print(f"   ✓ preview hidden: {not has_preview}")
        
        return success

    def test_get_own_shared_analysis(self):
        """Test accessing own shared analysis"""
        if not hasattr(self, 'share_id') or not self.share_id:
            print("   ⚠️ No share ID available, skipping test")
            return False
        
        # Test without auth (public access)
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Get Own Shared Analysis (public)",
            "GET", 
            f"shared/{self.share_id}",
            200
        )
        
        self.token = temp_token
        return success

    def test_annotations_in_analysis(self):
        """Test that analysis results include annotations field"""
        if not hasattr(self, 'analysis_id_en') or not self.analysis_id_en:
            print("   ⚠️ No English analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Check Annotations Field",
            "GET",
            f"analysis/{self.analysis_id_en}",
            200
        )
        
        if success:
            details = response.get('details', {})
            annotations = details.get('annotations', [])
            
            has_annotations = isinstance(annotations, list)
            print(f"   ✓ Has annotations field: {has_annotations}")
            
            if annotations:
                first_annotation = annotations[0]
                has_region = 'region' in first_annotation
                has_label = 'label' in first_annotation
                has_description = 'description' in first_annotation
                has_severity = 'severity' in first_annotation
                
                print(f"   ✓ Annotation structure complete: region={has_region}, label={has_label}, desc={has_description}, severity={has_severity}")
        
        return success

    def test_preview_field_in_analysis(self):
        """Test that image analysis includes preview field"""
        if not hasattr(self, 'analysis_id_en') or not self.analysis_id_en:
            print("   ⚠️ No English analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Check Preview Field",
            "GET",
            f"analysis/{self.analysis_id_en}",
            200
        )
        
        if success:
            has_preview = 'preview' in response
            is_base64 = bool(response.get('preview', '').startswith('data:') if response.get('preview') else False)
            
            print(f"   ✓ Has preview field: {has_preview}")
            if has_preview:
                print(f"   ✓ Preview is base64 format: {is_base64}")
        
        return success

    def test_compare_analyses(self):
        """Test comparing multiple analyses (will likely fail due to insufficient data)"""
        # This test requires at least 2 analyses
        compare_data = {"analysis_ids": ["test1", "test2"]}
        
        success, response = self.run_test(
            "Compare Analyses (expected to fail - insufficient data)",
            "POST",
            "analysis/compare",
            400,  # Expecting 400 due to invalid IDs
            data=compare_data
        )
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🚀 Starting Deepfake Detector API Tests")
        print("=" * 60)
        
        # Test sequence
        test_methods = [
            self.test_root_endpoint,
            self.test_login_existing_user,  # Use existing test user first
            self.test_get_current_user,
            self.test_get_analysis_stats,
            self.test_get_analysis_history,
            self.test_file_upload_analysis_english,
            self.test_file_upload_analysis_arabic,
            self.test_get_specific_analysis_english,
            self.test_get_specific_analysis_arabic,
            self.test_generate_pdf_report_english,
            self.test_generate_pdf_report_arabic,
            self.test_compare_analyses,
            # self.test_delete_analysis,  # Skip delete to preserve test data
        ]
        
        # Run tests
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Test {test_method.__name__} crashed: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Return success status
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = DeepfakeDetectorAPITester()
    success = tester.run_all_tests()
    
    # Save test results
    os.makedirs('/app/test_reports', exist_ok=True)
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())