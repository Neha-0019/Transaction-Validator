import React, { useState, useMemo } from 'react';
import { Copy, Check, Download } from 'lucide-react';

const CopyButton = ({ err }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e) => {
    e.stopPropagation();
    const text = `Row ${err.row_number} - ${err.field_name} (${err.error_type}): ${err.error_description}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="text-slate-400 hover:text-[#0d9488] p-1.5 rounded-[4px] hover:bg-slate-50 border border-slate-200 bg-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:opacity-100 duration-150 inline-flex items-center justify-center shadow-sm w-7 h-7"
      title="Copy raw error details"
    >
      {copied ? (
        <Check size={13} className="text-emerald-600" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
};

const ErrorReportTable = ({ errorReport = [], jobId, backendUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const handleDownloadLog = () => {
    if (jobId && backendUrl) {
      window.open(`${backendUrl}/api/download/${jobId}/error_log`, '_blank');
    }
  };

  // Extract unique field names and error types for filter dropdowns
  const uniqueFields = useMemo(() => {
    const fields = errorReport.map(err => err.field_name).filter(Boolean);
    return [...new Set(fields)].sort();
  }, [errorReport]);

  const uniqueTypes = useMemo(() => {
    const types = errorReport.map(err => err.error_type).filter(Boolean);
    return [...new Set(types)].sort();
  }, [errorReport]);

  // Filtered errors
  const filteredErrors = useMemo(() => {
    return errorReport.filter(err => {
      const matchesSearch = 
        (err.error_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (err.field_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (err.error_type || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesField = fieldFilter ? err.field_name === fieldFilter : true;
      const matchesType = typeFilter ? err.error_type === typeFilter : true;

      return matchesSearch && matchesField && matchesType;
    });
  }, [errorReport, searchTerm, fieldFilter, typeFilter]);

  // Clean field names for readable UI display
  const formatFieldName = (field) => {
    if (!field) return '';
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Validation Error Log</h3>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredErrors.length} of {errorReport.length} logged failures
              </p>
            </div>
            {jobId && (
              <button
                onClick={handleDownloadLog}
                className="w-fit inline-flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[4px] shadow-sm transition-colors focus:outline-none h-fit"
                title="Download detailed error log as CSV"
              >
                <Download size={11} className="w-3 h-3 flex-shrink-0" />
                <span>Download Error Log (CSV)</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search error messages..."
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

            {/* Field Filter */}
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Fields</option>
              {uniqueFields.map(field => (
                <option key={field} value={field}>
                  {formatFieldName(field)}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Error Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(searchTerm || fieldFilter || typeFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFieldFilter('');
                  setTypeFilter('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        {filteredErrors.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">No matching validation errors found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <th className="py-3 px-4 w-24">Row Number</th>
                <th className="py-3 px-4 w-48">Field Name</th>
                <th className="py-3 px-4 w-44">Error Type</th>
                <th className="py-3 px-4">Error Description</th>
                <th className="py-3 px-4 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-sans">
              {filteredErrors.map((err, index) => {
                const getBadgeStyles = (errorType) => {
                  const type = errorType || '';
                  if (type === 'Duplicate Value') {
                    return 'bg-amber-50 text-amber-800 border border-amber-200/50';
                  } else if (type === 'Missing Value') {
                    return 'bg-slate-100 text-slate-700 border border-slate-200';
                  } else if (type === 'Format Error') {
                    return 'bg-red-50 text-red-800 border border-red-200/30';
                  } else {
                    return 'bg-orange-50 text-orange-800 border border-orange-200/40'; // Validation Error / other types
                  }
                };

                return (
                  <tr 
                    key={index}
                    className="hover:bg-slate-50/80 transition-colors group relative"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      Row {err.row_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-[4px] text-xs font-mono">
                        {err.field_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium ${getBadgeStyles(err.error_type)}`}>
                        {err.error_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-650 font-normal">
                      {err.error_description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <CopyButton err={err} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Footer statistics summary */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between rounded-b-md">
        <span>CSV index references are 1-based (header is row 1).</span>
        <span>Filter matches: {filteredErrors.length}</span>
      </div>
    </div>
  );
};

export default ErrorReportTable;
