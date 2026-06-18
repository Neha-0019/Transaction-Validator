import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const RulesConfig = () => {
  const [rules, setRules] = useState([]);
  const [stagedRules, setStagedRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch rules from server
  const fetchRules = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/rules`);
      if (resp.ok) {
        const data = await resp.json();
        setRules(data);
        // Stage a deep copy of the loaded rules
        setStagedRules(JSON.parse(JSON.stringify(data)));
      } else {
        setMessage({ type: 'error', text: 'Failed to retrieve phone rules configuration from server.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error connecting to database service.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Check if staged rules differ from saved database rules
  const hasChanges = JSON.stringify(rules) !== JSON.stringify(stagedRules);

  // Handle cell edits
  const handleCellChange = (index, field, value) => {
    const updated = [...stagedRules];
    if (field === 'phone_length') {
      // Parse as integer, default to empty or 0 if invalid
      const parsed = parseInt(value, 10);
      updated[index][field] = isNaN(parsed) ? '' : parsed;
    } else {
      updated[index][field] = value;
    }
    setStagedRules(updated);
  };

  // Add a new empty rule row
  const handleAddRow = () => {
    setStagedRules([
      ...stagedRules,
      { country: '', phone_length: 10, phone_prefix: '' }
    ]);
  };

  // Delete a rule row
  const handleDeleteRow = (index) => {
    const updated = stagedRules.filter((_, idx) => idx !== index);
    setStagedRules(updated);
  };

  // Reset staged rules to last saved state
  const handleReset = () => {
    setStagedRules(JSON.parse(JSON.stringify(rules)));
    setMessage(null);
  };

  // Save changes to database
  const handleSave = async () => {
    // Validate rules first
    const invalidRow = stagedRules.find(r => !r.country.trim() || !r.phone_length);
    if (invalidRow) {
      setMessage({ type: 'error', text: 'Validation Error: Country name cannot be blank and phone length must be specified.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stagedRules)
      });

      if (resp.ok) {
        setMessage({ type: 'success', text: 'Phone rules configuration saved successfully to SQLite database.' });
        // Update local rules to reflect the saved settings
        const freshResp = await fetch(`${BACKEND_URL}/api/rules`);
        if (freshResp.ok) {
          const freshData = await freshResp.json();
          setRules(freshData);
          setStagedRules(JSON.parse(JSON.stringify(freshData)));
        }
      } else {
        const errorData = await resp.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save phone configuration.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error connecting to database service during save.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading configurations from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Country Rules Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure expected telephone digit lengths and dial prefixes for dynamic CSV phone validation.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Reset Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              hasChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Message Alerts */}
      {message && (
        <div className={`p-4 rounded-md text-sm border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {message.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasChanges && (
        <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">You have unsaved rules configuration.</span> Click "Save Configuration" to commit changes to SQLite.
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Country Name</th>
              <th className="py-3.5 px-6 w-48">Phone Digit Length</th>
              <th className="py-3.5 px-6 w-48">Country Phone Prefix</th>
              <th className="py-3.5 px-6 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {stagedRules.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No country rules defined. Click "Add Country Rule" below.
                </td>
              </tr>
            ) : (
              stagedRules.map((rule, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  {/* Country Name */}
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      value={rule.country}
                      onChange={(e) => handleCellChange(index, 'country', e.target.value)}
                      placeholder="e.g. India"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </td>
                  
                  {/* Phone Length */}
                  <td className="py-3 px-6">
                    <input
                      type="number"
                      value={rule.phone_length}
                      min={1}
                      max={20}
                      onChange={(e) => handleCellChange(index, 'phone_length', e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
                    />
                  </td>
                  
                  {/* Prefix */}
                  <td className="py-3 px-6">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-medium">+</span>
                      <input
                        type="text"
                        value={rule.phone_prefix || ''}
                        onChange={(e) => handleCellChange(index, 'phone_prefix', e.target.value)}
                        placeholder="e.g. 91"
                        className="w-full pl-6 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-mono"
                      />
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleDeleteRow(index)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline p-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Add Row Button Row */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Country Rule
          </button>
          
          <span className="text-xs text-slate-400 font-mono">
            {stagedRules.length} Rules Configured
          </span>
        </div>
      </div>
      
      {/* Help Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs text-slate-600 space-y-2">
        <h4 className="font-semibold text-slate-700">How phone prefix stripping works:</h4>
        <ul className="list-disc pl-4 space-y-1">
          <li>The validator cleans phone inputs of space, bracket, and plus symbols (e.g. <span className="font-mono text-slate-800">+91 (98765) 43210</span> becomes <span className="font-mono text-slate-800">919876543210</span>).</li>
          <li>If a dialing prefix is configured, the validator checks if the cleaned number starts with the prefix.</li>
          <li>If the prefix matches and the remaining digits equal the configured length, the prefix is stripped and validation succeeds.</li>
          <li>If the phone number does not start with the prefix, it checks if the entire phone number matches the configured length.</li>
        </ul>
      </div>
    </div>
  );
};

export default RulesConfig;
