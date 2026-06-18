# Transaction Validator - Internal operations portal

**Live Application**: [https://transaction-validator-frontend.onrender.com](https://transaction-validator-frontend.onrender.com)

**Transaction Validator** is a production-ready, full-stack web application designed for internal data operations teams to ingest, validate, sanitize, and partition large transaction CSV datasets. 


The application is built to resemble a realistic, professional developer-built admin console: using clean borders, flat slate styling, white canvas backgrounds, and solid corporate colors.

---

## 🎨 System Architecture & Features

The platform is divided into three functional operational tabs:

1. **Validate CSV Dataset**:
   - **Upload Ingestion Zone**: Drag-and-drop CSV parser with an interactive progress checklist.
   - **Ingestion Status Badge**: Dynamically displays validation outcomes (`SUCCESS` if 0 errors, `PROCESSED` if mixed, `FAILED` if no valid records or empty headers).
   - **Dashboard Statistics Grid**: Summary metrics cards showing Total Records, Valid Count, Invalid Count, Duplicates, and Success Rate, backed by Recharts widgets mapping validation split and country segments.
   - **Export Center**: Secure download triggers for Cleaned CSV outputs, Invalid CSV reports (annotated with error column details), and split chunks.
   - **File Splitting**: Cleaned transaction sets exceeding 10,000 rows are automatically split into 5,000-row batches and packaged inside a ZIP file.
   - **Error Report Table**: Scrollable failures list containing `Row Number`, `Field Name`, `Error Type`, and `Error Description` with client-side text searching and field filtering.

2. **Country Phone Rules**:
   - **SQLite Database Persistence**: Edit and stage dialing formats inside a grid persisting to local SQLite storage.
   - **Dynamic Phone Compliance Engine**: Cleaned phone digits are dynamically evaluated against country prefix lists and expected lengths:
     - The parser cleans the formatting spaces, parentheses, and plus prefixes.
     - If a dial prefix exists (e.g. `91` for India) and the input starts with it, the engine strips the prefix *only* if doing so yields the exact expected digit length (e.g. `10`).
     - If the number does not start with the prefix, it verifies if the entire cleaned sequence matches the expected length directly.
   - **Staged commits**: Edits are stored locally and committed to SQLite only after clicking **"Save Configuration"**.

3. **Processing History Log**:
   - **Audit Logs Trail**: Displays a historical log of all ingested files showing File Name, Record Count, Valid Count, Invalid Count, Status badge, and Processed Time.

---

## 📁 Repository Structure

```
Transaction Validator/
├── backend/
│   ├── app.py                # Flask entry point (APIs: /api/validate, /api/rules, /api/history)
│   ├── db.py                 # SQLite database helper layer (tables: country_rules, processing_history)
│   ├── validator.py          # Data validation engine (dynamic DB phone check, error reporting)
│   ├── config.py             # Schema rules config (required headers, payment lists, date formats)
│   ├── generate_samples.py   # Script to generate sample CSV files
│   ├── test_validator.py     # Backend unit tests
│   ├── test_api.py           # Integration API tests
│   └── test_data/            # Mock dataset folders
│       ├── sample_transactions.csv
│       └── large_transactions.csv
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx         # CSV ingestion drag-drop & progress checklist
│   │   │   ├── DashboardSummary.jsx   # Light-theme metrics grid & charts
│   │   │   ├── DownloadCenter.jsx     # Exporter triggers
│   │   │   ├── ErrorReportTable.jsx   # Error log grid with search & field filters
│   │   │   ├── RulesConfig.jsx        # staged database rules config table
│   │   │   └── ProcessingHistory.jsx  # History runs audit list
│   │   ├── App.jsx           # Sidebar tab layout structure
│   │   ├── index.css         # Styling base classes & scrollbars
│   │   └── main.jsx
│   ├── tailwind.config.js    # Tailwind layout config
│   ├── vite.config.js        # Vite compiler config
│   └── package.json          # UI dependencies (Recharts, Lucide-React, React 19)
├── render.yaml               # Blueprints infrastructure-as-code template
├── requirements.txt          # Python packaging manifest
├── .gitignore                # Git ignored patterns
└── README.md                 # Configuration and setup guide
```

---

## 🛠️ Local Development Setup

### Prerequisite Checklist
- **Python 3.10+**
- **Node.js 18+**

### 1. Flask Backend Server Setup
From the project root folder, execute the following:
```bash
# Create virtual environment
python -m venv venv

# Activate environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start backend server (binds to port 5000)
python backend/app.py
```

### 2. Frontend React Client Setup
In a separate terminal session, navigate to the `frontend` folder and run:
```bash
cd frontend

# Install package dependencies
npm install --legacy-peer-deps

# Start Vite dev server (runs on port 5173 / 5174)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Validation

### Backend Unit Tests
Execute the validator checks to verify country rule regexes, date formatting, payment constraints, and file split thresholds:
```bash
python -m unittest backend/test_validator.py
```

### API Integration Tests
Verify full-stack uploads, rules endpoints, and file download packaging:
```bash
python backend/test_api.py
```

### Mock CSV Generation
To recreate mock files for verification testing (25-row `sample_transactions.csv` and a 11,000-row `large_transactions.csv` for chunks testing):
```bash
python backend/generate_samples.py
```

---

## 🚀 Render Hosting Instructions

This codebase includes a `render.yaml` blueprint configuration to automatically orchestrate deployment.

### Step-by-Step Deployment Guide:
1. Push this project folder to your GitHub / GitLab repository.
2. Log in to the [Render Console](https://render.com).
3. Click **New +** at the top right and select **Blueprint**.
4. Link your repository.
5. Render will automatically parse `render.yaml` and queue:
   - `transaction-validator-backend`: Web service executing Flask (port 5000).
   - `transaction-validator-frontend`: Static site host distributing the React build.
6. Once deployed, copy your backend web service URL (e.g. `https://transaction-validator-backend.onrender.com`).
7. Inside the Static Site settings on Render, navigate to **Environment** and edit `VITE_BACKEND_URL` to match your copied backend URL.
8. Re-trigger a deploy of the static site. Your dashboard is fully operational and live!
