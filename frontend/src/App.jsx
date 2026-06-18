import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Settings, 
  History, 
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  FileSpreadsheet, 
  Layers,
  AlertOctagon,
  HelpCircle,
  Activity
} from 'lucide-react';
import UploadZone from './components/UploadZone';
import DashboardSummary from './components/DashboardSummary';
import DownloadCenter from './components/DownloadCenter';
import ErrorReportTable from './components/ErrorReportTable';
import RulesConfig from './components/RulesConfig';
import ProcessingHistory from './components/ProcessingHistory';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('validate'); // validate | rules | history
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [serviceStatus, setServiceStatus] = useState('checking'); // checking | healthy | unhealthy

  // Check health of backend on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/health`);
        if (resp.ok) {
          setServiceStatus('healthy');
        } else {
          setServiceStatus('unhealthy');
        }
      } catch (e) {
        setServiceStatus('unhealthy');
      }
    };
    checkHealth();
  }, []);

  const handleValidationSuccess = (data) => {
    setResults(data);
    setErrorMsg('');
  };

  const handleValidationError = (err) => {
    setResults(null);
    setErrorMsg(err);
  };

  const resetValidator = () => {
    setResults(null);
    setErrorMsg('');
  };

  // Determine validation status badge color
  const getValidationStatusBadge = () => {
    if (!results || !results.stats) return null;
    const { valid_records, invalid_records } = results.stats;
    
    if (invalid_records === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          SUCCESS
        </span>
      );
    } else if (valid_records === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          FAILED
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] mr-1.5"></span>
          PROCESSED
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-64 text-slate-300 flex flex-col border-r border-[#152e2a]/80 shrink-0" style={{ backgroundColor: '#0f1e1c' }}>
        
        {/* Branding header */}
        <div className="p-6 border-b border-[#152e2a]/50 flex items-center space-x-2.5 shrink-0">
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white font-sans">
              Transaction Validator
            </h1>
            <span className="text-[10px] text-slate-500 font-medium tracking-normal block mt-0.5">
              Operations Console
            </span>
          </div>
        </div>

        {/* Tab links */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('validate')}
            className={`w-full flex items-center space-x-2.5 py-2 transition-all ${
              activeTab === 'validate' 
                ? 'border-l-[3px] border-[#0d9488] bg-white/[0.03] text-white pl-[9px] rounded-r rounded-l-none text-xs font-semibold' 
                : 'text-slate-400 hover:text-white pl-3 hover:bg-white/[0.02] rounded text-xs font-semibold'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Validate CSV Dataset</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center space-x-2.5 py-2 transition-all ${
              activeTab === 'rules' 
                ? 'border-l-[3px] border-[#0d9488] bg-white/[0.03] text-white pl-[9px] rounded-r rounded-l-none text-xs font-semibold' 
                : 'text-slate-400 hover:text-white pl-3 hover:bg-white/[0.02] rounded text-xs font-semibold'
            }`}
          >
            <Settings size={16} />
            <span>Country Phone Rules</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center space-x-2.5 py-2 transition-all ${
              activeTab === 'history' 
                ? 'border-l-[3px] border-[#0d9488] bg-white/[0.03] text-white pl-[9px] rounded-r rounded-l-none text-xs font-semibold' 
                : 'text-slate-400 hover:text-white pl-3 hover:bg-white/[0.02] rounded text-xs font-semibold'
            }`}
          >
            <History size={16} />
            <span>Processing History Log</span>
          </button>
        </nav>

        {/* System Info footer */}
        <div className="p-4 border-t border-[#152e2a]/50 text-[10px] text-slate-500 font-sans space-y-1.5 shrink-0 bg-black/10">
          <div className="flex items-center justify-between">
            <span>System Status:</span>
            <span className="flex items-center text-[#0d9488] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] mr-1 animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Database:</span>
            <span className="text-[#0d9488] font-semibold">Active</span>
          </div>
          <div className="pt-2 border-t border-[#152e2a]/30 flex justify-between items-center text-[9px] text-slate-600">
            <span>v1.0 · ops</span>
            <span>Production</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-normal text-slate-400">Workspace</span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-medium text-slate-600 font-sans">
              {activeTab === 'validate' ? 'Transaction validation portal' : activeTab === 'rules' ? 'Phone dial rules' : 'Processing history audit'}
            </span>
          </div>

          {/* Health indicator badge */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 font-medium">Service Health:</span>
            {serviceStatus === 'checking' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold bg-slate-100 text-slate-500">
                Checking...
              </span>
            ) : serviceStatus === 'healthy' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
                OFFLINE
              </span>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* Tab 1: Validate CSV Tab */}
          {activeTab === 'validate' && (
            <div className="space-y-6">
              
              {!results ? (
                <div className="space-y-6">
                  {/* Hero Intro banner */}
                  <div className="bg-white border border-slate-200 rounded-[4px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <h2 className="text-base font-semibold text-slate-900 font-sans">Transaction Dataset Validator</h2>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-sans">
                        Upload transaction CSV files to validate phone numbers, dates, payment modes, duplicate records, and data quality issues. Generate cleaned outputs and downloadable validation reports.
                      </p>
                    </div>
                    
                    <div className="text-xs bg-slate-50 border border-slate-200 rounded-[4px] p-3 text-slate-650 shrink-0 font-sans space-y-1">
                      <div className="font-medium text-slate-500 mb-1 border-b border-slate-200 pb-0.5 text-[10px]">Expected ingestion schema:</div>
                      <div className="font-mono text-[11px] text-slate-600">• order_id, order_date</div>
                      <div className="font-mono text-[11px] text-slate-600">• customer_name, country</div>
                      <div className="font-mono text-[11px] text-slate-600">• phone_number, product_name</div>
                      <div className="font-mono text-[11px] text-slate-600">• quantity, payment_mode</div>
                      <div className="font-mono text-[11px] text-slate-600">• transaction_amount</div>
                    </div>
                  </div>

                  {/* Upload panel */}
                  <div className="max-w-2xl mx-auto">
                    <UploadZone 
                      onValidationSuccess={handleValidationSuccess}
                      onValidationError={handleValidationError}
                      backendUrl={BACKEND_URL}
                    />
                  </div>

                  {/* Supported Validations info strip */}
                  <div className="bg-white border border-slate-200 rounded-[4px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] max-w-2xl mx-auto">
                    <h3 className="text-[10px] font-medium text-slate-400 mb-2 font-sans">
                      Supported validations
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                      {[
                        "Phone Number Validation",
                        "Date & Time Validation",
                        "Payment Mode Validation",
                        "Missing Value Detection",
                        "Duplicate Detection",
                        "Invalid Amount Validation",
                        "Invalid Quantity Validation",
                        "Automatic CSV Chunking"
                      ].map((rule, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Upload Header / File Metadata Info Bar */}
                  <div className="bg-white border border-slate-200 rounded-[4px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 bg-teal-50 text-[#0d9488] rounded-[4px]">
                        <FileSpreadsheet size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans text-sm font-semibold text-slate-900 truncate max-w-xs md:max-w-md">
                            {results.file_name}
                          </h3>
                          {getValidationStatusBadge()}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Size: <strong className="text-slate-700 font-medium">{results.file_size_kb} KB</strong></span>
                          <span>•</span>
                          <span>Success Rate: <strong className="text-slate-700 font-medium">{results.stats.success_rate}%</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetValidator}
                      className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-[4px] text-xs font-medium transition-colors"
                    >
                      <RefreshCw size={12} />
                      <span>Ingest Another Dataset</span>
                    </button>
                  </div>

                  {/* Validation Statistics dashboard */}
                  <DashboardSummary stats={results.stats} />

                  {/* Download center exporter */}
                  <DownloadCenter 
                    jobId={results.job_id} 
                    hasChunks={results.has_chunks}
                    chunkCount={results.chunk_count}
                    backendUrl={BACKEND_URL}
                    stats={results.stats}
                  />

                  {/* Failure Report Table */}
                  {results.error_report && results.error_report.length > 0 && (
                    <ErrorReportTable errorReport={results.error_report} />
                  )}

                  {/* Clean File Success banner */}
                  {results.error_report && results.error_report.length === 0 && (
                    <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-md text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-slate-900">Dataset is 100% compliant!</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        No validation failures or integrity issues were identified. The parsed cleaned file has been written to output storage.
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Tab 2: Country Rules Tab */}
          {activeTab === 'rules' && (
            <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
              <RulesConfig />
            </div>
          )}

          {/* Tab 3: History Log Tab */}
          {activeTab === 'history' && (
            <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
              <ProcessingHistory />
            </div>
          )}

        </main>

        {/* Global Footer */}
        <footer className="py-4 text-center text-xs text-slate-400 mt-auto border-t border-slate-200 bg-white shrink-0 font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-center px-6">
            <span>&copy; 2026 Transaction Validator</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
