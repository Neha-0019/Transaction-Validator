# backend/app.py

import os
import sys
import shutil

# Enable package imports when running this file directly as a script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from backend.validator import process_transaction_csv
import backend.db as db

app = Flask(__name__)
# Enable CORS for all origins and routes
CORS(app)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'jobs')
TEMP_FOLDER = os.path.join(BASE_DIR, 'temp_uploads')
ALLOWED_EXTENSIONS = {'csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Transaction Data Validator API"}), 200

@app.route('/api/rules', methods=['GET', 'POST'])
def handle_rules():
    if request.method == 'GET':
        try:
            rules = db.get_rules()
            return jsonify(rules), 200
        except Exception as e:
            return jsonify({"error": f"Failed to fetch rules: {str(e)}"}), 500
    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not isinstance(data, list):
                return jsonify({"error": "Invalid request body. Expected a list of rules."}), 400
            
            success = db.save_rules(data)
            if success:
                return jsonify({"message": "Configuration saved successfully"}), 200
            else:
                return jsonify({"error": "Failed to save configuration"}), 500
        except Exception as e:
            return jsonify({"error": f"Failed to save rules: {str(e)}"}), 500

@app.route('/api/history', methods=['GET'])
def get_history_log():
    try:
        history = db.get_history()
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch processing history: {str(e)}"}), 500

@app.route('/api/validate', methods=['POST'])
def validate_transactions():
    # Check if request has file part
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected for upload"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only CSV files are supported."}), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(TEMP_FOLDER, filename)
        file.save(temp_path)
        
        # Get metadata
        file_size_bytes = os.path.getsize(temp_path)
        file_size_kb = round(file_size_bytes / 1024, 2)
        
        # Process CSV
        result = process_transaction_csv(temp_path, app.config['UPLOAD_FOLDER'])
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if not result.get("success"):
            return jsonify({"error": result.get("error")}), 400
            
        # Add metadata to response
        result["file_name"] = filename
        result["file_size_kb"] = file_size_kb
        
        return jsonify(result), 200
        
    except Exception as e:
        # Clean up in case of error
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": f"An unexpected error occurred during validation: {str(e)}"}), 500

@app.route('/api/download/<job_id>/<file_type>', methods=['GET'])
def download_file(job_id, file_type):
    job_dir = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
    
    if not os.path.exists(job_dir):
        return jsonify({"error": "Job not found or expired"}), 404
        
    if file_type == 'cleaned':
        filename = 'cleaned_transactions.csv'
        download_name = 'cleaned_transactions.csv'
    elif file_type == 'invalid':
        filename = 'invalid_transactions.csv'
        download_name = 'invalid_transactions.csv'
    elif file_type == 'chunks':
        filename = 'chunks.zip'
        download_name = 'transaction_chunks.zip'
    elif file_type == 'error_log':
        filename = 'validation_error_log.csv'
        download_name = 'validation_error_log.csv'
    else:
        return jsonify({"error": "Invalid file type requested"}), 400
        
    filepath = os.path.join(job_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": f"Requested file '{file_type}' is not available for this job."}), 404
        
    return send_from_directory(
        directory=job_dir,
        path=filename,
        as_attachment=True,
        download_name=download_name
    )

if __name__ == '__main__':
    # Get port from environment variable for Render deployment
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ["true", "1"]
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
