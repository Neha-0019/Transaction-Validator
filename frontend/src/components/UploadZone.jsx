import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Check } from 'lucide-react';

export default function UploadZone({ onValidationSuccess, onValidationError, backendUrl }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileStats, setFileStats] = useState({ name: '', size: '', rows: 0 });
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const PROCESSING_STEPS = [
    "Uploading dataset to validation engine...",
    "Parsing CSV headers and checking column layout...",
    "Scanning rows for empty fields and blank columns...",
    "Enforcing telephone formats and date rules...",
    "Scanning duplicate order keys and amount bounds...",
    "Generating final cleaned and invalid segments..."
  ];

  const processFileMetadata = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      onValidationError('Only CSV files are supported.');
      setMessage('Please select a valid CSV file.');
      setStatus('error');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus('idle');
    setMessage('');
    
    const sizeInMb = selectedFile.size / (1024 * 1024);
    const sizeStr = sizeInMb > 0.1 ? `${sizeInMb.toFixed(2)} MB` : `${(selectedFile.size / 1024).toFixed(2)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      const estimatedRows = Math.max(0, lines.length - 1);
      setFileStats({
        name: selectedFile.name,
        size: sizeStr,
        rows: estimatedRows
      });
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileMetadata(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFileMetadata(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUploadAndValidate = async () => {
    if (!file) return;

    setStatus('processing');
    setCurrentStepIndex(0);
    setMessage('Processing file...');

    const formData = new FormData();
    formData.append('file', file);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= PROCESSING_STEPS.length - 2) {
          clearInterval(stepInterval);
          return PROCESSING_STEPS.length - 2;
        }
        return prev + 1;
      });
    }, 250);

    try {
      const response = await fetch(`${backendUrl}/api/validate`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentStepIndex(PROCESSING_STEPS.length - 1);
        setTimeout(() => {
          setStatus('success');
          setMessage(`Processed ${data.stats.total_records.toLocaleString()} rows successfully.`);
          onValidationSuccess(data);
        }, 300);
      } else {
        setStatus('error');
        const err = data.error || 'Validation failed. Please check your CSV format.';
        setMessage(err);
        onValidationError(err);
      }
    } catch (error) {
      clearInterval(stepInterval);
      setStatus('error');
      const err = 'Failed to connect to the backend server. Please check if it is running.';
      setMessage(err);
      onValidationError(err);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileStats({ name: '', size: '', rows: 0 });
    setStatus('idle');
    setMessage('');
    setCurrentStepIndex(-1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-md border-2 border-dashed p-8 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/30' 
            : file 
              ? 'border-slate-300 bg-slate-50/50' 
              : 'border-slate-300 hover:border-slate-400 bg-white'
        } shadow-sm`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".csv"
          onChange={handleChange}
        />

        {!file ? (
          <div className="flex flex-col items-center justify-center text-center py-6 cursor-pointer" onClick={triggerFileInput}>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-full mb-3">
              <Upload size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Upload Transaction Dataset</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-3">
              Drag & drop a transaction CSV file or click to browse.<br />
              The system will validate records, detect errors, and generate cleaned downloadable outputs.
            </p>
            <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
              CSV format only
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between bg-slate-50 rounded border border-slate-200 p-4 mb-4">
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                  <FileText size={20} />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-slate-800 font-mono truncate max-w-xs md:max-w-md" title={fileStats.name}>
                    {fileStats.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                    <span>Size: <strong className="text-slate-700">{fileStats.size}</strong></span>
                    <span>•</span>
                    <span>Estimated Rows: <strong className="text-slate-700 font-mono">{fileStats.rows.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={resetFile}
                disabled={status === 'processing'}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-100 bg-white"
              >
                Clear
              </button>
            </div>

            {/* Checklist Loader */}
            {status === 'processing' && (
              <div className="mb-4 p-4 rounded border border-slate-200 bg-slate-50 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">
                  Engine Running Checklist
                </span>
                
                {PROCESSING_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  
                  return (
                    <div key={idx} className="flex items-center space-x-2.5 text-xs">
                      {isCompleted ? (
                        <div className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <Check size={8} />
                        </div>
                      ) : isActive ? (
                        <div className="flex-shrink-0 w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="flex-shrink-0 w-3.5 h-3.5 rounded-full border border-slate-300 bg-white flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        </div>
                      )}
                      <span className={`font-mono text-[11px] ${
                        isCompleted 
                          ? 'text-slate-400 line-through' 
                          : isActive 
                            ? 'text-blue-700 font-bold' 
                            : 'text-slate-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Success Alert */}
            {status === 'success' && (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-4 mb-4">
                <CheckCircle2 className="flex-shrink-0 text-emerald-600" size={16} />
                <span className="text-xs font-semibold">{message}</span>
              </div>
            )}

            {/* Error Alert */}
            {status === 'error' && (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 mb-4">
                <AlertTriangle className="flex-shrink-0 text-rose-600" size={16} />
                <span className="text-xs font-semibold leading-relaxed">{message}</span>
              </div>
            )}

            {/* Actions */}
            {status !== 'processing' && (
              <div className="flex items-center justify-end space-x-3">
                {status === 'success' ? (
                  <button
                    onClick={resetFile}
                    className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>Upload New File</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUploadAndValidate}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span>Run Validation Engine</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
