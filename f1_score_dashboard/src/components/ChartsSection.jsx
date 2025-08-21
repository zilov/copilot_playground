import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatToolName, getMetricKey, getMetricValue } from '../utils/formatters';

const ChartsSection = ({ 
  aggregatedResults, 
  selectedMetric, 
  comparisonType,
  winRateMetric,
  setWinRateMetric 
}) => {
  // Helper function to get the appropriate win rate field
  const getWinRateField = (metric) => {
    switch (metric) {
      case 'F1-score': return 'f1_win_rate';
      case 'Precision': return 'precision_win_rate';
      case 'Recall': return 'recall_win_rate';
      case 'Accuracy': return 'accuracy_win_rate';
      default: return 'f1_win_rate';
    }
  };

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Win Rate vs Baseline</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Metric:</label>
            <select 
              value={winRateMetric || selectedMetric} 
              onChange={(e) => setWinRateMetric && setWinRateMetric(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="F1-score">F1-score</option>
              <option value="Precision">Precision</option>
              <option value="Recall">Recall</option>
              <option value="Accuracy">Accuracy</option>
            </select>
          </div>
        </div>
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
                `${(value * 100).toFixed(1)}%`,
                `${winRateMetric || selectedMetric} Win Rate`
              ]}
            />
            <Bar dataKey={getWinRateField(winRateMetric || selectedMetric)} fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;
