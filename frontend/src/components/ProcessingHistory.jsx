import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    // Parse timestamp safely, converting legacy space-separated format to ISO 8601 UTC
    let dateStr = timestamp;
    if (timestamp.includes(' ') && !timestamp.includes('T')) {
      dateStr = timestamp.replace(' ', 'T') + 'Z';
    }
    const past = new Date(dateStr);
    const now = new Date();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  } catch (e) {
    return '';
  }
};

const ProcessingHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch history logs
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/history`);
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data);
      } else {
        setError('Failed to fetch processing history log.');
      }
    } catch (e) {
      console.error(e);
      setError('Error communicating with database service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history
  const filteredHistory = history.filter(item => 
    (item.file_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Processing History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail of all transaction CSV files ingested, validated, and processed by the system.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by file name..."
              className="w-64 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
          
          <button
            onClick={fetchHistory}
            className="p-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-md text-slate-600 transition-colors"
            title="Refresh Log"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
            <p className="text-sm text-slate-500">Loading ingestion log...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">No processing history recorded.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a CSV file in the validator panel to write a run log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-6">Total Records</th>
                  <th className="py-3 px-6">Valid Count</th>
                  <th className="py-3 px-6">Invalid Count</th>
                  <th className="py-3 px-6 w-32">Status</th>
                  <th className="py-3 px-6">Processed Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-sans">
                {filteredHistory.map((item, index) => {
                  const getStatusBorderClass = (status) => {
                    const s = (status || '').toLowerCase();
                    if (s === 'success') return 'border-l-[3px] border-l-emerald-500 pl-[21px]';
                    if (s === 'processed') return 'border-l-[3px] border-l-[#0d9488] pl-[21px]';
                    return 'border-l-[3px] border-l-red-500 pl-[21px]'; // Failed
                  };

                  return (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className={`py-3.5 pr-6 font-medium text-slate-900 truncate max-w-xs ${getStatusBorderClass(item.status)}`} title={item.file_name}>
                        {item.file_name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {item.records_count.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-emerald-600 font-medium">
                        {item.valid_count.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-rose-600 font-medium">
                        {item.invalid_count.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider ${
                          item.status === 'Success' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50' 
                            : item.status === 'Processed'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200/50'
                            : 'bg-rose-50 text-rose-800 border border-rose-200/50'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        <span>{item.processed_time}</span>
                        {getRelativeTime(item.processed_time) && (
                          <span className="text-slate-400 ml-2 font-normal text-xs">{getRelativeTime(item.processed_time)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer Statistics */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
          <span>Audit database persistence is active.</span>
          <span>Total runs in log: {filteredHistory.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingHistory;
