# backend/generate_samples.py

import os
import csv
import random

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_DATA_DIR = os.path.join(BASE_DIR, 'test_data')
os.makedirs(TEST_DATA_DIR, exist_ok=True)

# 1. Generate standard sample CSV
def generate_sample_csv():
    filepath = os.path.join(TEST_DATA_DIR, 'sample_transactions.csv')
    
    headers = [
        "order_id", "order_date", "customer_name", "country",
        "phone_number", "product_name", "quantity", "payment_mode", "transaction_amount"
    ]
    
    rows = [
        # Valid Records
        ["TXN1001", "18-06-2026", "Aarav Sharma", "India", "9876543210", "MacBook Pro", "1", "UPI", "1500.00"],
        ["TXN1002", "2026-06-18", "Tan Min", "Singapore", "81234567", "iPhone 15", "2", "Card", "2000.00"],
        ["TXN1003", "18/06/2026", "John Doe", "USA", "2025550143", "iPad Air", "5", "Net Banking", "2500.00"],
        ["TXN1004", "18-06-2026", "Farhan Halim", "Malaysia", "123456789", "Leather Wallet", "3", "Cash", "90.00"],
        ["TXN1005", "18-06-2026", "Sarah Connor", "USA", "+1 (202) 555-0199", "Noise-Cancelling Headphones", "1", "Wallet", "299.99"],
        ["TXN1006", "18-06-2026", "Rahul Verma", "India", "+91 99887 76655", "Mechanical Keyboard", "2", "Bank Transfer", "150.00"],
        
        # Missing values
        ["", "18-06-2026", "No ID Person", "India", "9876543210", "Laptop", "1", "UPI", "1000.00"], # Missing order_id
        ["TXN1007", "", "No Date Person", "Singapore", "81234567", "Smartphone", "1", "Card", "500.00"], # Missing order_date
        ["TXN1008", "18-06-2026", "", "USA", "2025550143", "Tablet", "1", "Cash", "300.00"], # Missing customer_name
        ["TXN1009", "18-06-2026", "No Country Person", "", "2025550143", "Tablet", "1", "Cash", "300.00"], # Missing country
        ["TXN1010", "18-06-2026", "No Phone Person", "India", "", "Tablet", "1", "Cash", "300.00"], # Missing phone_number
        
        # Duplicate Order ID
        ["TXN1001", "18-06-2026", "Duplicate Aarav", "India", "9876543210", "MacBook Pro", "1", "UPI", "1500.00"], # Duplicate TXN1001
        
        # Invalid Phone Numbers
        ["TXN1011", "18-06-2026", "Invalid India Phone", "India", "12345", "Coffee Mug", "1", "UPI", "15.00"], # India too short
        ["TXN1012", "18-06-2026", "Invalid SG Phone", "Singapore", "912345678", "Desk Mat", "1", "Card", "30.00"], # Singapore too long
        ["TXN1013", "18-06-2026", "Invalid US Phone", "USA", "555-0143", "Coffee Mug", "1", "Cash", "12.00"], # USA too short
        ["TXN1014", "18-06-2026", "Invalid MY Phone", "Malaysia", "91234", "Desk Mat", "1", "UPI", "25.00"], # Malaysia too short
        ["TXN1015", "18-06-2026", "Unsupported Country Phone", "Germany", "17612345678", "Book", "1", "Card", "20.00"], # Germany (unsupported)
        
        # Invalid Dates
        ["TXN1016", "06-18-2026", "Invalid Date Format 1", "USA", "2025550143", "T-Shirt", "2", "Card", "40.00"], # MM-DD-YYYY invalid
        ["TXN1017", "2026/06/18", "Invalid Date Format 2", "Singapore", "81234567", "Water Bottle", "1", "Cash", "15.00"], # YYYY/MM/DD invalid
        ["TXN1018", "32-06-2026", "Invalid Date Value", "India", "9876543210", "Socks", "3", "UPI", "10.00"], # Day 32 invalid
        
        # Invalid Payment Modes
        ["TXN1019", "18-06-2026", "Invalid Payment 1", "India", "9876543210", "Book", "1", "PayPal", "25.00"], # PayPal not allowed
        ["TXN1020", "18-06-2026", "Invalid Payment 2", "USA", "2025550143", "Book", "1", "Crypto", "50.00"], # Crypto not allowed
        
        # Negative Quantities & Amounts
        ["TXN1021", "18-06-2026", "Negative Qty Person", "India", "9876543210", "Pen Drive", "-2", "UPI", "30.00"], # Negative quantity
        ["TXN1022", "18-06-2026", "Negative Amt Person", "Singapore", "81234567", "SSD Drive", "1", "Card", "-120.00"], # Negative amount
        ["TXN1023", "18-06-2026", "Float Qty Person", "Malaysia", "123456789", "Gaming Mouse", "1.5", "UPI", "45.00"], # Float quantity
    ]
    
    with open(filepath, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"Generated sample CSV with {len(rows)} rows at {filepath}")

# 2. Generate large CSV with > 10,000 rows (specifically 11,000 rows)
def generate_large_csv():
    filepath = os.path.join(TEST_DATA_DIR, 'large_transactions.csv')
    
    headers = [
        "order_id", "order_date", "customer_name", "country",
        "phone_number", "product_name", "quantity", "payment_mode", "transaction_amount"
    ]
    
    countries = ["India", "Singapore", "USA", "Malaysia"]
    phones = {
        "India": "9876543210",
        "Singapore": "81234567",
        "USA": "2025550143",
        "Malaysia": "123456789"
    }
    payment_modes = ["UPI", "Card", "Cash", "Net Banking", "Wallet", "Bank Transfer"]
    products = ["Laptop", "Smartphone", "Tablet", "Monitor", "Keyboard", "Mouse", "Headphones"]
    
    rows = []
    # Generate 11,000 valid records
    for i in range(1, 11001):
        txn_id = f"TXN{100000 + i}"
        date = "18-06-2026"
        name = f"Customer {i}"
        country = random.choice(countries)
        phone = phones[country]
        product = random.choice(products)
        qty = str(random.randint(1, 10))
        pay_mode = random.choice(payment_modes)
        amount = f"{random.uniform(10.0, 2000.0):.2f}"
        
        rows.append([txn_id, date, name, country, phone, product, qty, pay_mode, amount])
        
    with open(filepath, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"Generated large CSV with {len(rows)} rows at {filepath}")

if __name__ == '__main__':
    generate_sample_csv()
    generate_large_csv()
