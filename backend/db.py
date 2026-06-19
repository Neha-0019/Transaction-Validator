# backend/db.py

import os
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create country_rules table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country TEXT UNIQUE NOT NULL,
            phone_length INTEGER NOT NULL,
            phone_prefix TEXT
        )
    ''')
    
    # 2. Create processing_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS processing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            records_count INTEGER NOT NULL,
            valid_count INTEGER NOT NULL,
            invalid_count INTEGER NOT NULL,
            status TEXT NOT NULL,
            processed_time TEXT NOT NULL
        )
    ''')
    
    # 3. Seed default country phone rules if table is empty
    cursor.execute('SELECT COUNT(*) FROM country_rules')
    if cursor.fetchone()[0] == 0:
        default_rules = [
            ("India", 10, "91"),
            ("Singapore", 8, "65"),
            ("USA", 10, "1"),
            ("UAE", 9, "971"),
            ("Malaysia", 9, "60")
        ]
        cursor.executemany(
            'INSERT INTO country_rules (country, phone_length, phone_prefix) VALUES (?, ?, ?)',
            default_rules
        )
        conn.commit()
        
    # 4. Seed default processing history if table is empty
    cursor.execute('SELECT COUNT(*) FROM processing_history')
    if cursor.fetchone()[0] == 0:
        now = datetime.now()
        
        # Helper to format time relative to now
        def get_past_time(hours_ago):
            return (now - timedelta(hours=hours_ago)).strftime('%Y-%m-%d %H:%M:%S')
            
        default_history = [
            ("large_transactions1.csv", 11000, 10500, 500, "Processed", get_past_time(24)),
            ("sample_transactions_1.csv", 50, 48, 2, "Processed", get_past_time(4)),
            ("sample_transactions.csv", 25, 6, 19, "Processed", get_past_time(1.5))
        ]
        cursor.executemany(
            'INSERT INTO processing_history (file_name, records_count, valid_count, invalid_count, status, processed_time) VALUES (?, ?, ?, ?, ?, ?)',
            default_history
        )
        conn.commit()
        
    conn.close()

def get_rules():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT country, phone_length, phone_prefix FROM country_rules ORDER BY country')
    rows = cursor.fetchall()
    rules = [dict(row) for row in rows]
    conn.close()
    return rules

def save_rules(rules_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # We wrap in a transaction to prevent partial updates
        cursor.execute('DELETE FROM country_rules')
        for r in rules_list:
            country = str(r.get('country', '')).strip()
            phone_length = int(r.get('phone_length', 10))
            phone_prefix = str(r.get('phone_prefix', '')).strip() if r.get('phone_prefix') else None
            
            if country:
                cursor.execute(
                    'INSERT OR REPLACE INTO country_rules (country, phone_length, phone_prefix) VALUES (?, ?, ?)',
                    (country, phone_length, phone_prefix)
                )
        conn.commit()
        success = True
    except Exception as e:
        conn.rollback()
        print(f"Database error saving rules: {str(e)}")
        success = False
    finally:
        conn.close()
    return success

def get_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT file_name, records_count, valid_count, invalid_count, status, processed_time FROM processing_history ORDER BY id DESC')
    rows = cursor.fetchall()
    history = [dict(row) for row in rows]
    conn.close()
    return history

def add_history_entry(file_name, records_count, valid_count, invalid_count, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    processed_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        cursor.execute(
            'INSERT INTO processing_history (file_name, records_count, valid_count, invalid_count, status, processed_time) VALUES (?, ?, ?, ?, ?, ?)',
            (file_name, records_count, valid_count, invalid_count, status, processed_time)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Database error adding history: {str(e)}")
    finally:
        conn.close()

# Auto-initialize database on import
init_db()
