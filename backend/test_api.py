# backend/test_api.py

import os
import sys
import time
import requests
import subprocess
import unittest

# Enable package imports when running this file directly as a script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestAPIIntegration(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Start Flask app in the background
        print("\n[SETUP] Starting Flask backend server in background...")
        cls.log_file = open("backend/flask_test.log", "w")
        cls.process = subprocess.Popen(
            ["python", "-m", "backend.app"],
            stdout=cls.log_file,
            stderr=cls.log_file
        )
        # Give the server 3 seconds to boot and bind to port 5000
        time.sleep(3)
        
    @classmethod
    def tearDownClass(cls):
        print("\n[TEARDOWN] Terminating Flask backend server...")
        cls.process.terminate()
        cls.process.wait()
        cls.log_file.close()
        
    def test_1_health_check(self):
        print("Running health check endpoint test...")
        resp = requests.get("http://127.0.0.1:5000/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "Transaction Data Validator API")

    def test_2_validate_sample_csv(self):
        print("Running validator test with sample_transactions.csv...")
        csv_path = "backend/test_data/sample_transactions.csv"
        
        with open(csv_path, 'rb') as f:
            files = {'file': ('sample_transactions.csv', f, 'text/csv')}
            resp = requests.post("http://127.0.0.1:5000/api/validate", files=files)
            
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["file_name"], "sample_transactions.csv")
        self.assertFalse(data["has_chunks"])
        
        stats = data["stats"]
        self.assertEqual(stats["total_records"], 25)
        # From sample file: 5 valid, 1 missing id, 1 missing date, 1 missing customer, 
        # 1 missing country, 1 missing phone, 1 duplicate, 5 invalid phones, 3 invalid dates, 
        # 2 invalid payments, 3 negative qty/amt/float qty.
        # Cleaned records: 5 (both rows of TXN1001 duplicate are flagged invalid)
        self.assertEqual(stats["valid_records"], 5)
        self.assertEqual(stats["invalid_records"], 20)
        
        # Test download cleaned CSV
        job_id = data["job_id"]
        cleaned_resp = requests.get(f"http://127.0.0.1:5000/api/download/{job_id}/cleaned")
        self.assertEqual(cleaned_resp.status_code, 200)
        self.assertIn("order_id,order_date,customer_name,country", cleaned_resp.text)
        
        # Test download invalid CSV
        invalid_resp = requests.get(f"http://127.0.0.1:5000/api/download/{job_id}/invalid")
        self.assertEqual(invalid_resp.status_code, 200)
        self.assertIn("validation_error", invalid_resp.text)

    def test_3_validate_large_csv_and_chunks(self):
        print("Running validator test with large_transactions.csv (11,000 rows)...")
        csv_path = "backend/test_data/large_transactions.csv"
        
        with open(csv_path, 'rb') as f:
            files = {'file': ('large_transactions.csv', f, 'text/csv')}
            resp = requests.post("http://127.0.0.1:5000/api/validate", files=files)
            
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["has_chunks"])
        self.assertEqual(data["chunk_count"], 3) # 11000 rows / 5000 size = 3 chunks (chunk_1.csv, chunk_2.csv, chunk_3.csv)
        
        # Test download chunks ZIP
        job_id = data["job_id"]
        chunks_resp = requests.get(f"http://127.0.0.1:5000/api/download/{job_id}/chunks")
        self.assertEqual(chunks_resp.status_code, 200)
        # Check ZIP signature
        self.assertTrue(chunks_resp.content.startswith(b'PK\x03\x04'))

if __name__ == '__main__':
    unittest.main()
