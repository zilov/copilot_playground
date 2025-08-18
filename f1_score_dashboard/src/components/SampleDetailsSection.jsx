import React from 'react';
import { formatToolName } from '../utils/formatters';

const SampleDetailsSection = ({ 
  data,
  aggregatedResults,
  selectedSample,
  setSelectedSample,
  sampleSearchTerm,
  setSampleSearchTerm,
  availableSamples,
  sampleData,
  exportSampleData,
  clearSearch,
  navigateSample
}) => {
  if (!data || !aggregatedResults) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Sample Details</h2>
      
      {/* Sample Selector */}
      <div className="mb-6">
        <label htmlFor="sample-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Sample (Tolid):
        </label>
        
        {/* Search field */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search samples..."
            value={sampleSearchTerm}
            onChange={(e) => setSampleSearchTerm(e.target.value)}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            id="sample-select"
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
            className="block flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a sample --</option>
            {availableSamples.map(sample => {
              const sampleToolCount = data.filter(row => row.Tolid === sample).length;
              return (
                <option key={sample} value={sample}>
                  {sample} ({sampleToolCount} tools)
                </option>
              );
            })}
          </select>
          
          {/* Navigation buttons */}
          {selectedSample && (
            <div className="flex space-x-2">
              <button
                onClick={() => navigateSample('prev')}
                disabled={availableSamples.indexOf(selectedSample) === 0}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => navigateSample('next')}
                disabled={availableSamples.indexOf(selectedSample) === availableSamples.length - 1}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          {selectedSample && (
            <p className="text-sm text-gray-500">
              Sample {availableSamples.indexOf(selectedSample) + 1} of {availableSamples.length}
              {sampleSearchTerm && ` (filtered from ${[...new Set(data.map(row => row.Tolid))].filter(Boolean).length} total)`}
            </p>
          )}
          {sampleSearchTerm && (
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Sample Results Table */}
      {selectedSample && sampleData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  Results for Sample: {selectedSample}
                  {sampleData[0]?.ID && ` (${sampleData[0].ID})`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing results for {sampleData.length} tools
                </p>
              </div>
              <button
                onClick={exportSampleData}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Export CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    F1-score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    vs Baseline
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precision
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recall
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FP
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FN
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TN
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  // Находим базовую линию (FCS+TIARA)
                  const baselineRow = sampleData.find(row => 
                    row.Tool === 'FCS+TIARA' || row.Tool === 'fcs+tiara' || row.Tool === 'fcs'
                  );
                  const baselineF1 = baselineRow ? parseFloat(baselineRow['F1-score']) || 0 : 0;
                  
                  return sampleData
                    .sort((a, b) => (parseFloat(b['F1-score']) || 0) - (parseFloat(a['F1-score']) || 0))
                    .map((row, index) => {
                      const f1Score = parseFloat(row['F1-score']) || 0;
                      const precision = parseFloat(row['Precision']) || 0;
                      const recall = parseFloat(row['Recall']) || 0;
                      const accuracy = parseFloat(row['Accuracy']) || 0;
                      const f1Diff = f1Score - baselineF1;
                      
                      // Определяем цвет для строки с FCS+TIARA
                      const isFCS = row.Tool === 'FCS+TIARA' || row.Tool === 'fcs+tiara' || row.Tool === 'fcs';
                      
                      return (
                        <tr 
                          key={`${row.Tool}-${index}`}
                          className={isFCS ? 'bg-blue-50' : 'hover:bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {isFCS && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  Baseline
                                </span>
                              )}
                              <span className={`text-sm font-medium ${isFCS ? 'text-blue-900' : 'text-gray-900'}`}>
                                {formatToolName(row.Tool)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono">
                            <span className={f1Score > 0.7 ? 'text-green-600' : f1Score > 0.5 ? 'text-yellow-600' : 'text-red-600'}>
                              {f1Score.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono">
                            {isFCS ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <span className={`${f1Diff > 0 ? 'text-green-600' : f1Diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {f1Diff > 0 ? '+' : ''}{f1Diff.toFixed(3)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-600">
                            {precision.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-600">
                            {recall.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-600">
                            {accuracy.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                            {row['True Positives (TP)'] || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                            {row['False Positives (FP)'] || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                            {row['False Negatives (FN)'] || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                            {row['True Negatives (TN)'] || 0}
                          </td>
                        </tr>
                      );
                    });
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Sample Statistics */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Best F1-score:</span>{' '}
                <span className="text-green-600 font-mono">
                  {Math.max(...sampleData.map(row => parseFloat(row['F1-score']) || 0)).toFixed(3)}
                </span>
                {' '}
                ({sampleData
                  .filter(row => parseFloat(row['F1-score']) === Math.max(...sampleData.map(r => parseFloat(r['F1-score']) || 0)))
                  .map(row => formatToolName(row.Tool))[0]})
              </div>
              <div>
                <span className="font-medium">Tools tested:</span>{' '}
                <span className="font-mono">{sampleData.length}</span>
              </div>
              <div>
                <span className="font-medium">Sample ID:</span>{' '}
                <span className="font-mono">{sampleData[0]?.ID || 'N/A'}</span>
              </div>
              <div>
                {(() => {
                  const baselineRow = sampleData.find(row => 
                    row.Tool === 'FCS+TIARA' || row.Tool === 'fcs+tiara' || row.Tool === 'fcs'
                  );
                  const baselineF1 = baselineRow ? parseFloat(baselineRow['F1-score']) || 0 : 0;
                  const betterThanBaseline = sampleData.filter(row => {
                    const isFCS = row.Tool === 'FCS+TIARA' || row.Tool === 'fcs+tiara' || row.Tool === 'fcs';
                    return !isFCS && (parseFloat(row['F1-score']) || 0) > baselineF1;
                  }).length;
                  
                  return (
                    <>
                      <span className="font-medium">Better than baseline:</span>{' '}
                      <span className={`font-mono ${betterThanBaseline > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {betterThanBaseline}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedSample && sampleData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data found for sample: {selectedSample}
        </div>
      )}
    </div>
  );
};

export default SampleDetailsSection;
