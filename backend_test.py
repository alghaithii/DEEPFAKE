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
        
        # Add authorization as query parameter (backend expects it this way)
        query_params = {}
        if self.token:
            query_params['authorization'] = f'Bearer {self.token}'
        if params:
            query_params.update(params)
        
        if headers:
            default_headers.update(headers)
        
        # Remove content-type for file uploads
        if files and 'Content-Type' in default_headers:
            del default_headers['Content-Type']

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if query_params:
            print(f"   Params: {query_params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=query_params)
            elif method == 'POST':
                if files:
                    # For file uploads, add auth to form data
                    if self.token:
                        if data is None:
                            data = {}
                        data['authorization'] = f'Bearer {self.token}'
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

    def test_file_upload_analysis(self):
        """Test file upload and analysis with a small test image"""
        # Create a small test image file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            # Create minimal JPEG data (this is a minimal valid JPEG header)
            jpeg_data = bytes([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
            ])
            tmp_file.write(jpeg_data)
            tmp_file_path = tmp_file.name
        
        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'file': ('test_image.jpg', f, 'image/jpeg')}
                data = {'language': 'en'}
                
                success, response = self.run_test(
                    "File Upload & Analysis",
                    "POST",
                    "analysis/upload",
                    200,
                    data=data,
                    files=files
                )
                
                if success:
                    self.analysis_id = response.get('id')
                    print(f"   ✓ Analysis ID: {self.analysis_id}")
                
                return success
                
        finally:
            # Clean up temp file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    def test_get_specific_analysis(self):
        """Test getting a specific analysis by ID"""
        if not hasattr(self, 'analysis_id') or not self.analysis_id:
            print("   ⚠️ No analysis ID available, skipping test")
            return False
            
        success, response = self.run_test(
            "Get Specific Analysis",
            "GET",
            f"analysis/{self.analysis_id}",
            200
        )
        return success

    def test_generate_pdf_report(self):
        """Test PDF report generation"""
        if not hasattr(self, 'analysis_id') or not self.analysis_id:
            print("   ⚠️ No analysis ID available, skipping test")
            return False
            
        print(f"\n🔍 Testing PDF Report Generation...")
        url = f"{self.api_url}/analysis/{self.analysis_id}/report"
        params = {'authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = requests.get(url, params=params)
            success = response.status_code == 200 and 'application/pdf' in response.headers.get('content-type', '')
            
            self.log_test("PDF Report Generation", success, response.status_code,
                         "PDF content received" if success else f"Expected PDF, got {response.headers.get('content-type')}")
            return success
            
        except Exception as e:
            self.log_test("PDF Report Generation", False, "ERROR", f"Exception: {str(e)}")
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
            self.test_file_upload_analysis,
            self.test_get_specific_analysis,
            self.test_generate_pdf_report,
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