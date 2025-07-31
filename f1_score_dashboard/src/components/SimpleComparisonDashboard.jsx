import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const SimpleComparisonDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/f1_results.csv');
      const csvText = await response.text();
      
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      const processedData = parsed.data
        .filter(row => row.ID && row.Tool && row['F1-score'])
        .map(row => ({
          ...row,
          'F1-score': parseFloat(row['F1-score']),
          Precision: parseFloat(row.Precision),
          Recall: parseFloat(row.Recall),
          Accuracy: parseFloat(row.Accuracy)
        }));

      console.log('Processed data sample:', processedData.slice(0, 5));
      setData(processedData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data) return [];

    // Group by dataset (ID-Tolid)
    const grouped = _.groupBy(data, row => `${row.ID}-${row.Tolid}`);
    const comparisons = [];

    Object.entries(grouped).forEach(([dataset, rows]) => {
      const fcsRow = rows.find(r => r.Tool === 'fcs+tiara');
      if (fcsRow) {
        rows.filter(r => r.Tool !== 'fcs+tiara').forEach(sourmashRow => {
          comparisons.push({
            dataset,
            tool: sourmashRow.Tool.replace('sourmash_', ''),
            sourmash_f1: sourmashRow['F1-score'],
            fcs_f1: fcsRow['F1-score'],
            f1_diff: sourmashRow['F1-score'] - fcsRow['F1-score']
          });
        });
      }
    });

    // Aggregate by tool
    const toolGroups = _.groupBy(comparisons, 'tool');
    return Object.entries(toolGroups).map(([tool, comps]) => ({
      tool,
      avg_f1: _.mean(comps.map(c => c.sourmash_f1)),
      avg_f1_diff: _.mean(comps.map(c => c.f1_diff)),
      count: comps.length
    })).sort((a, b) => b.avg_f1_diff - a.avg_f1_diff);
  }, [data]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sourmash vs FCS+TIARA Comparison</h1>
      
      {data && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p>Loaded {data.length} rows, generated {chartData.length} tool comparisons</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Average F1-Score by Tool</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tool" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value.toFixed(4), name]}
              />
              <Bar dataKey="avg_f1" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">F1-Score Difference from FCS+TIARA</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tool" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  (value > 0 ? '+' : '') + value.toFixed(4), 
                  'F1 Difference'
                ]}
              />
              <Bar dataKey="avg_f1_diff">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avg_f1_diff > 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Summary Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Tool</th>
                  <th className="px-4 py-2 text-right">Avg F1-Score</th>
                  <th className="px-4 py-2 text-right">F1 Difference</th>
                  <th className="px-4 py-2 text-right">Comparisons</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-25' : ''}>
                    <td className="px-4 py-2">{row.tool}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.avg_f1.toFixed(4)}</td>
                    <td className={`px-4 py-2 text-right font-mono ${row.avg_f1_diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.avg_f1_diff > 0 ? '+' : ''}{row.avg_f1_diff.toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-right">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleComparisonDashboard;
