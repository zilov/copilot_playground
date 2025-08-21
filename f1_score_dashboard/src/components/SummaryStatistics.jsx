import React from 'react';
import { formatToolName } from '../utils/formatters';

const SummaryStatistics = ({ aggregatedResults }) => {
  return (
    <div className="mt-8 bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Tool</th>
              <th className="px-4 py-2 text-right">Avg F1 Diff</th>
              <th className="px-4 py-2 text-right">F1 Win Rate</th>
              <th className="px-4 py-2 text-right">Precision Win Rate</th>
              <th className="px-4 py-2 text-right">Recall Win Rate</th>
              <th className="px-4 py-2 text-right">F1 Wins/Losses</th>
              <th className="px-4 py-2 text-right">Avg Tool F1</th>
              <th className="px-4 py-2 text-right">Avg Baseline F1</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedResults.map((result, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-25' : ''}>
                <td className="px-4 py-2 text-sm">{formatToolName(result.tool)}</td>
                <td className={`px-4 py-2 text-right text-sm font-mono ${result.avg_f1_diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.avg_f1_diff > 0 ? '+' : ''}{(result.avg_f1_diff || 0).toFixed(3)}
                </td>
                <td className="px-4 py-2 text-right text-sm">{((result.f1_win_rate || 0) * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-sm">{((result.precision_win_rate || 0) * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-sm">{((result.recall_win_rate || 0) * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-sm">
                  <span className="text-green-600">{result.f1_wins || 0}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-red-600">{result.f1_losses || 0}</span>
                </td>
                <td className="px-4 py-2 text-right text-sm font-mono">{(result.avg_tool_f1 || 0).toFixed(3)}</td>
                <td className="px-4 py-2 text-right text-sm font-mono">{(result.avg_fcs_f1 || 0).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryStatistics;
