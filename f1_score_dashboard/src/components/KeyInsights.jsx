import React from 'react';
import { formatToolName } from '../utils/formatters';

const KeyInsights = ({ aggregatedResults }) => {
  return (
    <div className="mt-8 bg-blue-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-medium mb-2">Best Performing Tools:</h3>
          <ul className="space-y-1">
            {aggregatedResults.slice(0, 3).map((result, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{formatToolName(result.tool)}</span>
                <span className="font-mono text-green-600">
                  +{(result.avg_f1_diff || 0).toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Comparison Summary:</h3>
          <ul className="space-y-1">
            <li>Total tools tested: {aggregatedResults.length}</li>
            <li>Tools outperforming baseline: {aggregatedResults.filter(r => r.avg_f1_diff > 0).length}</li>
            <li>Average improvement range: {Math.min(...aggregatedResults.map(r => r.avg_f1_diff || 0)).toFixed(3)} to {Math.max(...aggregatedResults.map(r => r.avg_f1_diff || 0)).toFixed(3)}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KeyInsights;
