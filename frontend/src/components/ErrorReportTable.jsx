import React, { useState, useMemo } from 'react';

const ErrorReportTable = ({ errorReport = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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
          <div>
            <h3 className="text-base font-semibold text-slate-800">Validation Error Log</h3>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredErrors.length} of {errorReport.length} logged failures
            </p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredErrors.map((err, index) => (
                <tr 
                  key={index}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">
                    Row {err.row_number}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">
                      {err.field_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      err.error_type === 'Missing Value' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/50' 
                        : err.error_type === 'Duplicate Value'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200/50'
                        : err.error_type === 'Range/Type Error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200/50'
                        : 'bg-red-50 text-red-800 border border-red-200/50'
                    }`}>
                      {err.error_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-normal">
                    {err.error_description}
                  </td>
                </tr>
              ))}
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
