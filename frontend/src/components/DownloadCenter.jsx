import React from 'react';
import { Download, FolderArchive, Info, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function DownloadCenter({ jobId, hasChunks, chunkCount, backendUrl, stats }) {
  if (!jobId) return null;

  const validCount = stats?.valid_records || 0;
  const invalidCount = stats?.invalid_records || 0;

  const handleDownload = (fileType) => {
    window.open(`${backendUrl}/api/download/${jobId}/${fileType}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Export Center</h3>
        <p className="text-xs text-slate-500 mt-0.5">Download validation outputs and cleaned dataset chunks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cleaned CSV Card */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-md w-fit">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">Cleaned Transactions</h4>
              <p className="text-xs text-slate-500 mt-0.5">Contains only the fully valid transaction records.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded py-1 px-2.5 w-fit text-xs text-emerald-700 font-mono">
              {validCount.toLocaleString()} rows
            </div>
          </div>
          
          <button
            onClick={() => handleDownload('cleaned')}
            disabled={validCount === 0}
            className="mt-5 w-full flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-emerald-500/20 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Download size={14} />
            <span>Download Cleaned CSV</span>
          </button>
        </div>

        {/* Invalid CSV Card */}
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-md w-fit">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">Invalid Transactions</h4>
              <p className="text-xs text-slate-500 mt-0.5">Contains rejected records with details in the <code>validation_error</code> column.</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded py-1 px-2.5 w-fit text-xs text-rose-700 font-mono">
              {invalidCount.toLocaleString()} rows
            </div>
          </div>

          <button
            onClick={() => handleDownload('invalid')}
            disabled={invalidCount === 0}
            className="mt-5 w-full flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-rose-500/20 text-white font-semibold py-1.5 px-3 rounded text-xs transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <Download size={14} />
            <span>Download Invalid CSV</span>
          </button>
        </div>

        {/* Chunks ZIP Card */}
        <div className={`rounded-md border p-5 bg-white shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors ${
          hasChunks 
            ? 'border-slate-200' 
            : 'border-slate-200 opacity-60'
        }`}>
          <div className="space-y-3">
            <div className={`p-2.5 rounded-md w-fit ${hasChunks ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-450'}`}>
              <FolderArchive size={22} />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${hasChunks ? 'text-slate-800' : 'text-slate-450'}`}>Split Chunks (ZIP)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cleaned dataset automatically split into chunks of 5,000 rows.
              </p>
            </div>
            {hasChunks ? (
              <div className="bg-blue-50 border border-blue-100 rounded py-1 px-2.5 w-fit text-xs text-blue-700 font-mono">
                {chunkCount} CSV files packaged
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 bg-slate-50 rounded p-1.5 border border-slate-200">
                <Info size={12} className="flex-shrink-0" />
                <span>Triggered for CSV inputs &gt; 10,000 rows</span>
              </div>
            )}
          </div>

          <button
            onClick={() => handleDownload('chunks')}
            disabled={!hasChunks}
            className={`mt-5 w-full flex items-center justify-center space-x-1.5 font-semibold py-1.5 px-3 rounded text-xs transition-colors ${
              hasChunks
                ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Download size={14} />
            <span>Download Chunks ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
