import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Database, CheckCircle, AlertTriangle, FileWarning, Globe, Percent } from 'lucide-react';

const COLORS = {
  valid: '#10b981',   // emerald-500
  invalid: '#ef4444', // red-500
  blue: '#3b82f6',    // blue-500
  yellow: '#f59e0b',  // amber-500
  purple: '#8b5cf6',  // purple-500
  teal: '#14b8a6',    // teal-500
  errors: [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#14b8a6', // teal
    '#ec4899', // pink
    '#6366f1', // indigo
  ]
};

const CustomYAxisTick = ({ x, y, payload }) => {
  if (!payload || payload.value === undefined || payload.value === null) return null;
  return (
    <text x={x - 8} y={y} dy={4} textAnchor="end" fill="#64748b" fontSize={11} className="font-sans">
      {payload.value}
    </text>
  );
};

export default function DashboardSummary({ stats }) {
  if (!stats) return null;

  const {
    total_records,
    valid_records,
    invalid_records,
    duplicate_records,
    countries_found,
    success_rate,
    error_counts,
    country_distribution
  } = stats;

  // 1. Data for Valid vs Invalid (Donut Chart)
  const validationSplitData = [
    { name: 'Valid Records', value: valid_records, color: COLORS.valid },
    { name: 'Invalid Records', value: invalid_records, color: COLORS.invalid }
  ];

  // 2. Data for Country Distribution
  const countryChartData = Object.entries(country_distribution || {}).map(([country, count]) => ({
    name: country,
    Transactions: count
  }));

  // 3. Data for Error Breakdown (Horizontal Bar Chart)
  const errorBreakdownData = Object.entries(error_counts || {})
    .filter(([_, count]) => count > 0)
    .map(([errorName, count]) => ({
      name: errorName,
      Occurrences: count
    }))
    .sort((a, b) => b.Occurrences - a.Occurrences);

  const metrics = [
    {
      title: 'Total Records',
      value: total_records.toLocaleString(),
      icon: <Database className="text-blue-500" size={20} />,
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50/50'
    },
    {
      title: 'Valid Records',
      value: valid_records.toLocaleString(),
      icon: <CheckCircle className="text-emerald-500" size={20} />,
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/50'
    },
    {
      title: 'Invalid Records',
      value: invalid_records.toLocaleString(),
      icon: <AlertTriangle className="text-red-500" size={20} />,
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50/50'
    },
    {
      title: 'Duplicate Records',
      value: duplicate_records.toLocaleString(),
      icon: <FileWarning className="text-amber-500" size={20} />,
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/50'
    },
    {
      title: 'Countries Found',
      value: countries_found.length.toString(),
      icon: <Globe className="text-purple-500" size={20} />,
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50/50'
    },
    {
      title: 'Success Rate',
      value: `${success_rate}%`,
      icon: <Percent className="text-teal-500" size={20} />,
      borderColor: 'border-teal-200',
      bgColor: 'bg-teal-50/50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => (
          <div 
            key={idx} 
            className={`rounded-md border p-4 flex flex-col justify-between bg-white shadow-sm hover:border-slate-300 transition-colors ${metric.borderColor} ${metric.bgColor}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-500 tracking-tight">{metric.title}</span>
              {metric.icon}
            </div>
            <span className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Valid vs Invalid Donut Chart */}
        <div className="lg:col-span-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Validation Split</h3>
            <p className="text-xs text-slate-400 mt-0.5">Valid vs rejected records ratio</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
            {total_records === 0 ? (
              <span className="text-sm text-slate-400">No data available</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validationSplitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {validationSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    itemStyle={{ color: '#1e293b', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center stat labels */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Success</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{success_rate}%</span>
            </div>
          </div>
          <div className="flex justify-center space-x-6 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.valid }}></div>
              <span className="text-slate-600 font-medium">Cleaned ({valid_records})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.invalid }}></div>
              <span className="text-slate-600 font-medium">Invalid ({invalid_records})</span>
            </div>
          </div>
        </div>

        {/* Country Distribution */}
        <div className="lg:col-span-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Country Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Valid records segment count by country</p>
          </div>
          <div className="flex-1 mt-4 min-h-[200px]">
            {countryChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                No valid transaction records to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    itemStyle={{ color: '#1e293b', fontSize: 12 }}
                  />
                  <Bar dataKey="Transactions" fill="#2563eb" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Error breakdown (If any) */}
        {invalid_records > 0 && (
          <div className="lg:col-span-12 rounded-md border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[260px]">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Validation Error Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Occurrences breakdown of custom validation failures</p>
            </div>
            <div className="flex-1 mt-4 h-[300px]">
              {errorBreakdownData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                  No failures to analyze.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={errorBreakdownData} 
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    barCategoryGap="25%"
                  >
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#64748b" 
                      fontSize={11} 
                      tickLine={false}
                      width={180}
                      interval={0}
                      tick={<CustomYAxisTick />}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      itemStyle={{ color: '#1e293b', fontSize: 12 }}
                    />
                    <Bar 
                      dataKey="Occurrences" 
                      radius={[0, 3, 3, 0]} 
                    >
                      {errorBreakdownData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS.errors[index % COLORS.errors.length]} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
