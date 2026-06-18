# backend/test_validator.py

import os
import sys
import unittest
import pandas as pd
import tempfile
import shutil

# Enable package imports when running this file directly as a script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.validator import validate_phone, validate_date, process_transaction_csv

class TestValidator(unittest.TestCase):
    
    def setUp(self):
        # Create temp folder for output files
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        # Clean up temp folder
        shutil.rmtree(self.test_dir)

    def test_phone_validation_india(self):
        # India rule: exactly 10 digits, optional 91 prefix
        self.assertTrue(validate_phone("9876543210", "India"))
        self.assertTrue(validate_phone("+91 98765-43210", "India"))
        self.assertTrue(validate_phone("919876543210", "India"))
        self.assertFalse(validate_phone("12345", "India"))  # Too short
        self.assertFalse(validate_phone("98765432100", "India"))  # Too long

    def test_phone_validation_singapore(self):
        # Singapore rule: exactly 8 digits, optional 65 prefix
        self.assertTrue(validate_phone("81234567", "Singapore"))
        self.assertTrue(validate_phone("+65 9123-4567", "Singapore"))
        self.assertTrue(validate_phone("6581234567", "Singapore"))
        self.assertFalse(validate_phone("1234567", "Singapore"))  # Too short
        self.assertFalse(validate_phone("812345678", "Singapore"))  # Too long

    def test_phone_validation_usa(self):
        # USA rule: exactly 10 digits, optional 1 prefix
        self.assertTrue(validate_phone("2025550143", "USA"))
        self.assertTrue(validate_phone("+1 (202) 555-0143", "USA"))
        self.assertTrue(validate_phone("12025550143", "USA"))
        self.assertFalse(validate_phone("5550143", "USA"))  # Too short

    def test_phone_validation_malaysia(self):
        # Malaysia rule: 9-10 digits, optional 60 prefix
        self.assertTrue(validate_phone("123456789", "Malaysia"))  # 9 digits
        self.assertTrue(validate_phone("1234567890", "Malaysia"))  # 10 digits
        self.assertTrue(validate_phone("+60 12-345 6789", "Malaysia"))
        self.assertFalse(validate_phone("12345678", "Malaysia"))  # Too short (8 digits)
        self.assertFalse(validate_phone("12345678901", "Malaysia"))  # Too long (11 digits)

    def test_date_validation(self):
        # Allowed formats: DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY
        self.assertTrue(validate_date("18-06-2026"))
        self.assertTrue(validate_date("2026-06-18"))
        self.assertTrue(validate_date("18/06/2026"))
        self.assertFalse(validate_date("06-18-2026"))  # MM-DD-YYYY not allowed
        self.assertFalse(validate_date("2026/06/18"))  # YYYY/MM/DD not allowed
        self.assertFalse(validate_date("invalid-date"))

    def test_csv_processing(self):
        # Create a mock CSV with various combinations
        data = {
            "order_id": ["O001", "O002", "O003", "O003", "O005", "O006", "O007", "O008"],
            "order_date": ["18-06-2026", "2026-06-18", "18/06/2026", "18-06-2026", "", "2026-06-18", "18-06-2026", "18-06-2026"],
            "customer_name": ["John Doe", "Jane Smith", "Ali", "Ali", "Bob", "", "Sarah", "Kyle"],
            "country": ["India", "Singapore", "USA", "USA", "India", "Malaysia", "Singapore", "UK"],
            "phone_number": ["9876543210", "81234567", "2025550143", "2025550143", "9876543210", "123456789", "999", "12345"],
            "product_name": ["Laptop", "Phone", "Tablet", "Tablet", "Monitor", "Keyboard", "Mouse", "Headphones"],
            "quantity": ["1", "2", "3", "3", "-5", "1", "1", "1"],
            "payment_mode": ["UPI", "Card", "Cash", "Cash", "Wallet", "UPI", "InvalidMode", "UPI"],
            "transaction_amount": ["1200.50", "800.00", "350.00", "350.00", "100.00", "50.00", "20.00", "-50.00"]
        }
        
        df = pd.DataFrame(data)
        temp_csv = os.path.join(self.test_dir, "temp_test.csv")
        df.to_csv(temp_csv, index=False)
        
        # Run processor
        result = process_transaction_csv(temp_csv, self.test_dir)
        
        self.assertTrue(result["success"])
        stats = result["stats"]
        
        # Check overall stats
        self.assertEqual(stats["total_records"], 8)
        
        # Valid:
        # O001: Valid
        # O002: Valid
        # O006: Valid (Wait, customer_name is missing, so it is invalid because customer_name is required!)
        # Let's count valid rows.
        # Invalid records analysis:
        # O001 (Valid)
        # O002 (Valid)
        # O003 (Duplicate Order ID) - both O003 rows will be flagged as duplicates
        # O005 (Negative Quantity: -5)
        # O006 (Missing Customer Name)
        # O007 (Invalid Phone Number "999" for Singapore, Invalid Payment Mode "InvalidMode")
        # O008 (Unsupported Country for Phone: UK, Negative Transaction Amount: -50.00)
        # Therefore, only O001 and O002 are fully valid!
        # Total valid should be 2.
        self.assertEqual(stats["valid_records"], 2)
        self.assertEqual(stats["invalid_records"], 6)
        
        # Check duplicate records count
        # Row O003 is duplicated (two rows). duplicates count = 2.
        self.assertEqual(stats["duplicate_records"], 2)
        
        # Verify output files exist
        job_id = result["job_id"]
        cleaned_file = os.path.join(self.test_dir, job_id, "cleaned_transactions.csv")
        invalid_file = os.path.join(self.test_dir, job_id, "invalid_transactions.csv")
        
        self.assertTrue(os.path.exists(cleaned_file))
        self.assertTrue(os.path.exists(invalid_file))
        
        # Load invalid file and inspect errors
        invalid_df = pd.read_csv(invalid_file)
        
        # Check specific error column
        errors = invalid_df['validation_error'].tolist()
        
        # Check O005 error: should contain "Negative Quantity"
        o005_err = invalid_df[invalid_df['order_id'] == 'O005']['validation_error'].values[0]
        self.assertIn("Negative Quantity", o005_err)
        
        # Check O007 error: should contain "Invalid Phone Number" and "Invalid Payment Mode"
        o007_err = invalid_df[invalid_df['order_id'] == 'O007']['validation_error'].values[0]
        self.assertIn("Invalid Phone Number", o007_err)
        self.assertIn("Invalid Payment Mode", o007_err)

    def test_consolidated_customer_country_csv_processing(self):
        # Create a mock CSV with customer_country consolidated column
        data = {
            "order_id": ["O001", "O002", "O003", "O004", "O005"],
            "order_date": ["18-06-2026", "2026-06-18", "18/06/2026", "18-06-2026", "18-06-2026"],
            "customer_country": ["Aarav Sharma India", "Tan Min Singapore", "USA", "No Country Person", ""],
            "phone_number": ["9876543210", "81234567", "2025550143", "2025550143", "9876543210"],
            "product_name": ["Laptop", "Phone", "Tablet", "Tablet", "Monitor"],
            "quantity": ["1", "2", "3", "3", "5"],
            "payment_mode": ["UPI", "Card", "Cash", "Cash", "Wallet"],
            "transaction_amount": ["1200.50", "800.00", "350.00", "350.00", "100.00"]
        }
        
        df = pd.DataFrame(data)
        temp_csv = os.path.join(self.test_dir, "temp_cc_test.csv")
        df.to_csv(temp_csv, index=False)
        
        # Run processor
        result = process_transaction_csv(temp_csv, self.test_dir)
        
        self.assertTrue(result["success"])
        stats = result["stats"]
        
        # Check overall stats
        self.assertEqual(stats["total_records"], 5)
        
        # Valid vs Invalid:
        # O001: Aarav Sharma India -> Valid (name="Aarav Sharma", country="India", phone matches India)
        # O002: Tan Min Singapore -> Valid (name="Tan Min", country="Singapore", phone matches Singapore)
        # O003: USA -> Invalid (name is missing! error: "Missing Customer Name")
        # O004: No Country Person -> Invalid (country is missing! error: "Missing Country")
        # O005: "" -> Invalid (both name and country missing! error: "Missing Customer Name", "Missing Country")
        
        self.assertEqual(stats["valid_records"], 2)
        self.assertEqual(stats["invalid_records"], 3)
        
        # Verify output files exist and check their columns
        job_id = result["job_id"]
        cleaned_file = os.path.join(self.test_dir, job_id, "cleaned_transactions.csv")
        invalid_file = os.path.join(self.test_dir, job_id, "invalid_transactions.csv")
        
        cleaned_df = pd.read_csv(cleaned_file)
        invalid_df = pd.read_csv(invalid_file)
        
        # The output columns must exactly preserve "customer_country" and NOT have "customer_name" or "country"
        self.assertIn("customer_country", cleaned_df.columns)
        self.assertNotIn("customer_name", cleaned_df.columns)
        self.assertNotIn("country", cleaned_df.columns)
        
        self.assertIn("customer_country", invalid_df.columns)
        self.assertNotIn("customer_name", invalid_df.columns)
        self.assertNotIn("country", invalid_df.columns)
        
        # Check specific errors in invalid preview dict
        preview = result["invalid_preview"]
        self.assertEqual(len(preview), 3)
        
        # Preview for O003 should have customer_name as empty and country as USA
        o003_preview = next(p for p in preview if p["order_id"] == "O003")
        self.assertEqual(o003_preview["customer_name"], "")
        self.assertEqual(o003_preview["country"], "USA")
        self.assertIn("Missing Customer Name", o003_preview["validation_error"])
        
        # Preview for O004 should have customer_name as "No Country Person" and country as empty
        o004_preview = next(p for p in preview if p["order_id"] == "O004")
        self.assertEqual(o004_preview["customer_name"], "No Country Person")
        self.assertEqual(o004_preview["country"], "")
        self.assertIn("Missing Country", o004_preview["validation_error"])

if __name__ == '__main__':
    unittest.main()

