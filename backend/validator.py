# backend/validator.py

import os
import re
import uuid
import zipfile
import pandas as pd
from datetime import datetime
from backend.config import REQUIRED_FIELDS, ALLOWED_PAYMENT_MODES, ACCEPTED_DATE_FORMATS, KNOWN_COUNTRIES
import backend.db as db

# Helper to validate phone number dynamically using db rules
def validate_phone(phone, country, rules=None):
    if pd.isna(phone) or pd.isna(country):
        return False
    
    if rules is None:
        rules = db.get_rules()
        
    country_str = str(country).strip()
    rule = next((r for r in rules if r['country'].lower() == country_str.lower()), None)
    if not rule:
        return False
    
    # Strip spaces, hyphens, parenthesis, and leading plus sign
    phone_clean = re.sub(r'[\s\-\(\)\+]', '', str(phone))
    if not phone_clean.isdigit():
        return False
    
    prefix = rule.get('phone_prefix')
    expected_length = rule.get('phone_length', 10)
    
    cleaned_no_prefix = phone_clean
    if prefix:
        prefix_str = str(prefix).strip()
        if prefix_str and phone_clean.startswith(prefix_str):
            # For Malaysia, it can be 9 or 10 digits
            if country_str.lower() == 'malaysia' and prefix_str == '60':
                if len(phone_clean) in (11, 12):
                    cleaned_no_prefix = phone_clean[len(prefix_str):]
            elif len(phone_clean) == len(prefix_str) + expected_length:
                cleaned_no_prefix = phone_clean[len(prefix_str):]
                
    if country_str.lower() == 'malaysia':
        return len(cleaned_no_prefix) in (9, 10)
    return len(cleaned_no_prefix) == expected_length

# Helper to validate date format
def validate_date(date_val):
    if pd.isna(date_val):
        return False
    
    date_str = str(date_val).strip()
    for fmt in ACCEPTED_DATE_FORMATS:
        try:
            datetime.strptime(date_str, fmt)
            return True
        except ValueError:
            continue
    return False

# Helper to parse consolidated customer_country field
def parse_customer_country(val):
    if pd.isna(val) or str(val).strip() == "":
        return "", ""
    
    s = str(val).strip()
    
    # Check if the entire string matches a known country
    for country in KNOWN_COUNTRIES:
        if s.lower() == country.lower():
            return "", country
            
    # Try to find a known country at the end of the string
    # We look for a country name preceded by whitespace, dash, comma, or pipe
    for country in KNOWN_COUNTRIES:
        pattern = r'[\s\-\|,]+' + re.escape(country) + r'$'
        match = re.search(pattern, s, re.IGNORECASE)
        if match:
            name = s[:match.start()].strip()
            return name, country
            
    # If no known country is found, treat the whole string as the name
    return s, ""

# Core validation engine
def process_transaction_csv(file_path, output_dir):
    """
    Processes the uploaded CSV, performs validation, generates outputs,
    and returns dashboard statistics.
    """
    # Create the job directory
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(output_dir, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    # Load rules dynamically from SQLite
    rules = db.get_rules()
    configured_countries = {r['country'].lower(): r for r in rules}
    
    # Read the CSV file
    try:
        # read_csv with dtype=str to prevent auto-truncating phone numbers or removing leading zeros
        df = pd.read_csv(file_path, dtype=str)
    except Exception as e:
        db.add_history_entry(os.path.basename(file_path), 0, 0, 0, "Failed")
        return {
            "success": False,
            "error": f"Failed to read CSV file: {str(e)}"
        }
    
    total_records = len(df)
    if total_records == 0:
        db.add_history_entry(os.path.basename(file_path), 0, 0, 0, "Failed")
        return {
            "success": False,
            "error": "The uploaded CSV file is empty."
        }
    
    # Verify presence of required columns
    df.columns = [col.strip().lower() for col in df.columns]
    
    has_consolidated = 'customer_country' in df.columns
    
    if has_consolidated:
        expected_fields = [f for f in REQUIRED_FIELDS if f not in ['customer_name', 'country']] + ['customer_country']
    else:
        expected_fields = REQUIRED_FIELDS
        
    missing_columns = [col for col in expected_fields if col not in df.columns]
    if missing_columns:
        db.add_history_entry(os.path.basename(file_path), total_records, 0, total_records, "Failed")
        return {
            "success": False,
            "error": f"CSV is missing required columns: {', '.join(missing_columns)}"
        }
    
    # Mark duplicates in order_id
    order_ids_clean = df['order_id'].fillna('').str.strip()
    has_order_id = order_ids_clean != ''
    duplicates = df.duplicated(subset=['order_id'], keep=False) & has_order_id
    
    row_errors = [[] for _ in range(total_records)]
    error_report = []
    
    error_counts = {
        "Missing Fields": 0,
        "Duplicate Order ID": 0,
        "Invalid Date Format": 0,
        "Invalid Phone Number": 0,
        "Invalid Payment Mode": 0,
        "Negative Quantity": 0,
        "Negative Transaction Amount": 0,
        "Invalid Formats": 0
    }
    
    countries_found = set()
    
    for idx, row in df.iterrows():
        row_num = idx + 2
        
        if has_consolidated:
            cc_val = row.get('customer_country')
            if pd.isna(cc_val) or str(cc_val).strip() == "":
                name_val = ""
                country_val = ""
                parsed_missing_name = True
                parsed_missing_country = True
            else:
                name_val, country_val = parse_customer_country(cc_val)
                parsed_missing_name = (name_val == "")
                parsed_missing_country = (country_val == "")
        else:
            name_val = row.get('customer_name')
            country_val = row.get('country')
            parsed_missing_name = pd.isna(name_val) or str(name_val).strip() == ""
            parsed_missing_country = pd.isna(country_val) or str(country_val).strip() == ""
            
        # 1. Check for missing values/blank fields
        missing_fields = []
        normal_fields = ["order_id", "order_date", "phone_number", "product_name", "quantity", "payment_mode", "transaction_amount"]
        for field in normal_fields:
            val = row.get(field)
            if pd.isna(val) or str(val).strip() == "":
                missing_fields.append(field)
                
        if parsed_missing_name:
            missing_fields.append("customer_name")
        if parsed_missing_country:
            missing_fields.append("country")
        
        if missing_fields:
            error_counts["Missing Fields"] += 1
            for field in missing_fields:
                field_display = field.replace('_', ' ').title()
                row_errors[idx].append(f"Missing {field_display}")
                error_report.append({
                    "row_number": row_num,
                    "field_name": field,
                    "error_type": "Missing Value",
                    "error_description": f"Field '{field_display}' is empty or missing."
                })
        
        # 2. Check for Duplicate Order ID
        order_id_val = row.get('order_id')
        if 'order_id' not in missing_fields:
            if duplicates.iloc[idx]:
                row_errors[idx].append("Duplicate Order ID")
                error_counts["Duplicate Order ID"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "order_id",
                    "error_type": "Duplicate Value",
                    "error_description": f"Order ID '{order_id_val}' is duplicated in the dataset."
                })
                
        # 3. Check for Date Validation
        date_val = row.get('order_date')
        if 'order_date' not in missing_fields:
            if not validate_date(date_val):
                row_errors[idx].append("Invalid Date Format")
                error_counts["Invalid Date Format"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "order_date",
                    "error_type": "Format Error",
                    "error_description": f"Date '{date_val}' is invalid or does not match accepted formats (DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY)."
                })
                
        # 4. Check for Country
        country_str = str(country_val).strip() if not pd.isna(country_val) else ""
        if country_str:
            countries_found.add(country_str)
            
        # 5. Check for Phone Number
        phone_val = row.get('phone_number')
        if 'phone_number' not in missing_fields:
            if 'country' in missing_fields:
                row_errors[idx].append("Cannot Validate Phone (Country Missing)")
                error_counts["Invalid Phone Number"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "phone_number",
                    "error_type": "Validation Error",
                    "error_description": "Cannot validate phone number because country is missing."
                })
            elif country_str.lower() not in configured_countries:
                row_errors[idx].append(f"Unsupported Country for Phone: {country_str}")
                error_counts["Invalid Phone Number"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "phone_number",
                    "error_type": "Validation Error",
                    "error_description": f"Country '{country_str}' is not configured in phone validation rules."
                })
            elif not validate_phone(phone_val, country_str, rules):
                row_errors[idx].append("Invalid Phone Number")
                error_counts["Invalid Phone Number"] += 1
                
                # Fetch configuration for error description
                rule = configured_countries.get(country_str.lower())
                rule_desc = f"length {rule['phone_length']}" if rule else "valid length"
                if rule and rule.get('phone_prefix'):
                    rule_desc += f" (optional prefix {rule['phone_prefix']})"
                    
                error_report.append({
                    "row_number": row_num,
                    "field_name": "phone_number",
                    "error_type": "Format Error",
                    "error_description": f"Phone number '{phone_val}' is invalid for country '{country_str}'. Expected {rule_desc}."
                })
                
        # 6. Check for Payment Mode
        payment_val = row.get('payment_mode')
        if 'payment_mode' not in missing_fields:
            payment_str = str(payment_val).strip()
            matched_mode = next((m for m in ALLOWED_PAYMENT_MODES if m.lower() == payment_str.lower()), None)
            if matched_mode is None:
                row_errors[idx].append("Invalid Payment Mode")
                error_counts["Invalid Payment Mode"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "payment_mode",
                    "error_type": "Validation Error",
                    "error_description": f"Payment mode '{payment_val}' is not allowed. Allowed: {', '.join(ALLOWED_PAYMENT_MODES)}."
                })
            else:
                df.at[idx, 'payment_mode'] = matched_mode
                
        # 7. Check for Quantity
        qty_val = row.get('quantity')
        if 'quantity' not in missing_fields:
            try:
                qty_num = float(qty_val)
                if qty_num < 0:
                    row_errors[idx].append("Negative Quantity")
                    error_counts["Negative Quantity"] += 1
                    error_report.append({
                        "row_number": row_num,
                        "field_name": "quantity",
                        "error_type": "Range/Type Error",
                        "error_description": f"Quantity '{qty_val}' cannot be negative."
                    })
                elif not qty_num.is_integer():
                    row_errors[idx].append("Quantity must be an integer")
                    error_counts["Invalid Formats"] += 1
                    error_report.append({
                        "row_number": row_num,
                        "field_name": "quantity",
                        "error_type": "Range/Type Error",
                        "error_description": f"Quantity '{qty_val}' must be an integer."
                    })
            except (ValueError, TypeError):
                row_errors[idx].append("Invalid Quantity Format")
                error_counts["Invalid Formats"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "quantity",
                    "error_type": "Range/Type Error",
                    "error_description": f"Quantity '{qty_val}' is not a valid number."
                })
                
        # 8. Check for Transaction Amount
        amt_val = row.get('transaction_amount')
        if 'transaction_amount' not in missing_fields:
            try:
                amt_num = float(amt_val)
                if amt_num < 0:
                    row_errors[idx].append("Negative Transaction Amount")
                    error_counts["Negative Transaction Amount"] += 1
                    error_report.append({
                        "row_number": row_num,
                        "field_name": "transaction_amount",
                        "error_type": "Range/Type Error",
                        "error_description": f"Transaction amount '{amt_val}' cannot be negative."
                    })
            except (ValueError, TypeError):
                row_errors[idx].append("Invalid Transaction Amount Format")
                error_counts["Invalid Formats"] += 1
                error_report.append({
                    "row_number": row_num,
                    "field_name": "transaction_amount",
                    "error_type": "Range/Type Error",
                    "error_description": f"Transaction amount '{amt_val}' is not a valid decimal number."
                })

    # Map validation errors to df
    validation_error_col = [", ".join(errs) if errs else "" for errs in row_errors]
    df["validation_error"] = validation_error_col
    
    # Split into valid and invalid records
    is_valid_row = df["validation_error"] == ""
    cleaned_df = df[is_valid_row].drop(columns=["validation_error"])
    invalid_df = df[~is_valid_row]
    
    valid_count = len(cleaned_df)
    invalid_count = len(invalid_df)
    duplicate_count = duplicates.sum()
    
    # Save cleaned and invalid files
    cleaned_path = os.path.join(job_dir, "cleaned_transactions.csv")
    invalid_path = os.path.join(job_dir, "invalid_transactions.csv")
    
    cleaned_df.to_csv(cleaned_path, index=False)
    invalid_df.to_csv(invalid_path, index=False)
    
    # File Splitting Feature (> 10,000 rows)
    chunk_files = []
    has_chunks = False
    
    if valid_count > 10000:
        has_chunks = True
        chunks_dir = os.path.join(job_dir, "chunks")
        os.makedirs(chunks_dir, exist_ok=True)
        
        # Split into chunks of 5000 rows
        chunk_size = 5000
        num_chunks = (valid_count + chunk_size - 1) // chunk_size
        
        zip_path = os.path.join(job_dir, "chunks.zip")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for i in range(num_chunks):
                start_row = i * chunk_size
                end_row = min((i + 1) * chunk_size, valid_count)
                chunk_df = cleaned_df.iloc[start_row:end_row]
                
                chunk_filename = f"chunk_{i + 1}.csv"
                chunk_filepath = os.path.join(chunks_dir, chunk_filename)
                chunk_df.to_csv(chunk_filepath, index=False)
                
                # Add to ZIP
                zipf.write(chunk_filepath, chunk_filename)
                chunk_files.append(chunk_filename)
                
    # Calculate overall stats
    success_rate = (valid_count / total_records) * 100 if total_records > 0 else 0
    
    # Breakdown of country counts in cleaned dataset
    if has_consolidated:
        cleaned_countries = cleaned_df['customer_country'].apply(lambda x: parse_customer_country(x)[1])
        country_counts = cleaned_countries.value_counts().to_dict()
    else:
        country_counts = cleaned_df['country'].value_counts().to_dict()
        
    # Determine Status
    if invalid_count == 0:
        status = "Success"
    elif valid_count == 0:
        status = "Failed"
    else:
        status = "Processed"
        
    # Log validation history to database
    db.add_history_entry(os.path.basename(file_path), total_records, valid_count, invalid_count, status)
    
    # Create sample error preview (limit to first 20 rows of invalid data)
    invalid_preview = []
    for idx, row in invalid_df.head(20).iterrows():
        row_dict = {str(k): ("" if pd.isna(v) else str(v)) for k, v in row.to_dict().items()}
        
        # Explicit customer_name and country for backward compatibility
        if has_consolidated:
            cc_val = row.get("customer_country")
            c_name, c_country = parse_customer_country(cc_val)
            row_dict["customer_name"] = c_name
            row_dict["country"] = c_country
        else:
            row_dict["customer_name"] = row_dict.get("customer_name", "")
            row_dict["country"] = row_dict.get("country", "")
            
        row_dict["row_index"] = int(idx)
        invalid_preview.append(row_dict)
        
    return {
        "success": True,
        "job_id": job_id,
        "stats": {
            "total_records": total_records,
            "valid_records": valid_count,
            "invalid_records": invalid_count,
            "duplicate_records": int(duplicate_count),
            "countries_found": list(countries_found),
            "success_rate": round(success_rate, 2),
            "error_counts": error_counts,
            "country_distribution": country_counts
        },
        "has_chunks": has_chunks,
        "chunk_count": len(chunk_files),
        "invalid_preview": invalid_preview,
        "error_report": error_report
    }

