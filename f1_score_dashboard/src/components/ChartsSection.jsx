import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatToolName, getMetricKey, getMetricValue } from '../utils/formatters';

const ChartsSection = ({ 
  aggregatedResults, 
  selectedMetric, 
  comparisonType 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Comparison Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {selectedMetric} Comparison ({comparisonType === 'absolute' ? 'Absolute Values' : 'Difference from Baseline'})
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={aggregatedResults} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="tool" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={10}
              tickFormatter={formatToolName}
            />
            <YAxis 
              domain={comparisonType === 'absolute' ? [0, 'dataMax + 0.1'] : ['dataMin - 0.05', 'dataMax + 0.05']}
              tickFormatter={(value) => value.toFixed(3)}
            />
            <Tooltip 
              labelFormatter={(label) => formatToolName(label)}
              formatter={(value) => [value?.toFixed(3) || 'N/A', selectedMetric]}
            />
            <Bar 
              dataKey={getMetricKey(selectedMetric, comparisonType)}
              fill={comparisonType === 'absolute' ? "#3b82f6" : "#ef4444"}
            >
              {comparisonType === 'difference' && aggregatedResults.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMetricValue(entry, selectedMetric, comparisonType) > 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win/Loss Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Win Rate vs Baseline (F1-score)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={aggregatedResults} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="tool" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              fontSize={10}
              tickFormatter={formatToolName}
            />
            <YAxis 
              domain={[0, 1]} 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              labelFormatter={(label) => formatToolName(label)}
              formatter={(value, name) => [
                name === 'win_rate' ? `${(value * 100).toFixed(1)}%` : value,
                name === 'win_rate' ? 'Win Rate' : name
              ]}
            />
            <Bar dataKey="win_rate" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;
