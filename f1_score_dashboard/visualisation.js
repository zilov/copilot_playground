import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterPlot, Scatter, LineChart, Line } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const ComparisonDashboard = () => {
  const [data, setData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('F1-score');
  const [comparisonType, setComparisonType] = useState('absolute');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle file upload
  const handleFileUpload = (file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('Please upload a CSV file');
      return;
    }

    setUploadStatus('Processing file...');
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Clean headers
          const cleanedData = results.data.map(row => {
            const cleanedRow = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim();
              cleanedRow[cleanKey] = row[key];
            });
            return cleanedRow;
          });

          setData(cleanedData);
          setIsFileUploaded(true);
          setUploadStatus(`Successfully loaded ${cleanedData.length} rows`);
        } catch (error) {
          console.error('Error processing CSV:', error);
          setUploadStatus('Error processing CSV file');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setUploadStatus('Error parsing CSV file');
      }
    });
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Load and process data from file system (fallback)
  const loadData = async () => {
    try {
      const fileContent = await window.fs.readFile('f1_results 1.csv', { encoding: 'utf8' });
      const parsedData = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      // Clean headers
      const cleanedData = parsedData.data.map(row => {
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim();
          cleanedRow[cleanKey] = row[key];
        });
        return cleanedRow;
      });

      setData(cleanedData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Process data for comparisons
  const processedData = useMemo(() => {
    if (!data) return null;

    // Group by ID/Tolid to get paired comparisons
    const groupedByDataset = _.groupBy(data, row => `${row.ID}-${row.Tolid}`);
    
    const comparisons = [];
    
    Object.entries(groupedByDataset).forEach(([datasetKey, rows]) => {
      const fcsResult = rows.find(r => r.Tool === 'fcs+tiara');
      const sourmashResults = rows.filter(r => r.Tool !== 'fcs+tiara');
      
      if (fcsResult) {
        sourmashResults.forEach(sourmashResult => {
          const comparison = {
            dataset: datasetKey,
            tool: sourmashResult.Tool,
            fcs_f1: fcsResult['F1-score'],
            fcs_precision: fcsResult.Precision,
            fcs_recall: fcsResult.Recall,
            fcs_accuracy: fcsResult.Accuracy,
            sourmash_f1: sourmashResult['F1-score'],
            sourmash_precision: sourmashResult.Precision,
            sourmash_recall: sourmashResult.Recall,
            sourmash_accuracy: sourmashResult.Accuracy,
            f1_diff: sourmashResult['F1-score'] - fcsResult['F1-score'],
            precision_diff: sourmashResult.Precision - fcsResult.Precision,
            recall_diff: sourmashResult.Recall - fcsResult.Recall,
            accuracy_diff: sourmashResult.Accuracy - fcsResult.Accuracy,
            f1_ratio: sourmashResult['F1-score'] / fcsResult['F1-score'],
            precision_ratio: sourmashResult.Precision / fcsResult.Precision,
            recall_ratio: sourmashResult.Recall / fcsResult.Recall,
            accuracy_ratio: sourmashResult.Accuracy / fcsResult.Accuracy
          };
          comparisons.push(comparison);
        });
      }
    });

    return comparisons;
  }, [data]);

  // Aggregate results by tool
  const aggregatedResults = useMemo(() => {
    if (!processedData) return null;

    const toolGroups = _.groupBy(processedData, 'tool');
    
    return Object.entries(toolGroups).map(([tool, comparisons]) => {
      const stats = {
        tool: tool.replace('sourmash_', ''),
        count: comparisons.length,
        avg_f1_diff: _.mean(comparisons.map(c => c.f1_diff)),
        avg_precision_diff: _.mean(comparisons.map(c => c.precision_diff)),
        avg_recall_diff: _.mean(comparisons.map(c => c.recall_diff)),
        avg_accuracy_diff: _.mean(comparisons.map(c => c.accuracy_diff)),
        avg_sourmash_f1: _.mean(comparisons.map(c => c.sourmash_f1)),
        avg_fcs_f1: _.mean(comparisons.map(c => c.fcs_f1)),
        wins: comparisons.filter(c => c.f1_diff > 0).length,
        losses: comparisons.filter(c => c.f1_diff < 0).length,
        ties: comparisons.filter(c => Math.abs(c.f1_diff) < 0.001).length
      };
      
      stats.win_rate = stats.wins / stats.count;
      
      return stats;
    }).sort((a, b) => b.avg_f1_diff - a.avg_f1_diff);
  }, [processedData]);

  React.useEffect(() => {
    if (!isFileUploaded) {
      loadData();
    }
  }, [isFileUploaded]);

  if (!data || !processedData || !aggregatedResults) {
    return <div className="p-8">Loading data...</div>;
  }

  const getMetricValue = (item, metric) => {
    switch(metric) {
      case 'F1-score': return comparisonType === 'absolute' ? item.avg_sourmash_f1 : item.avg_f1_diff;
      case 'Precision': return comparisonType === 'absolute' ? item.avg_sourmash_precision : item.avg_precision_diff;
      case 'Recall': return comparisonType === 'absolute' ? item.avg_sourmash_recall : item.avg_recall_diff;
      case 'Accuracy': return comparisonType === 'absolute' ? item.avg_sourmash_accuracy : item.avg_accuracy_diff;
      default: return item.avg_f1_diff;
    }
  };

  const formatToolName = (tool) => {
    return tool.replace('db_filter_', '').replace('_', ' ');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sourmash vs FCS+TIARA Comparison</h1>
      
      {/* File Upload Section */}
      {!data && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Upload CSV Data</h2>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports CSV files with F1-score comparison data
            </p>
            
            {/* File Input */}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="csvFileInput"
            />
            <label
              htmlFor="csvFileInput"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              Choose File
            </label>
          </div>
          
          {/* Upload Status */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded ${
              uploadStatus.includes('Successfully') 
                ? 'bg-green-100 text-green-700' 
                : uploadStatus.includes('Error') 
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Data Source Indicator */}
      {data && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Data source:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              isFileUploaded 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isFileUploaded ? 'Uploaded file' : 'Default file'}
            </span>
            {isFileUploaded && (
              <button
                onClick={() => {
                  setData(null);
                  setIsFileUploaded(false);
                  setUploadStatus('');
                }}
                className="text-red-600 hover:text-red-800 text-xs underline ml-2"
              >
                Upload different file
              </button>
            )}
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Metric:</label>
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="F1-score">F1-score</option>
                <option value="Precision">Precision</option>
                <option value="Recall">Recall</option>
                <option value="Accuracy">Accuracy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Comparison Type:</label>
              <select 
                value={comparisonType} 
                onChange={(e) => setComparisonType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="absolute">Absolute Values</option>
                <option value="difference">Difference from FCS+TIARA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Comparison Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {selectedMetric} Comparison ({comparisonType === 'absolute' ? 'Absolute' : 'Difference from FCS+TIARA'})
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
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => formatToolName(label)}
                    formatter={(value) => [value.toFixed(4), selectedMetric]}
                  />
                  <Bar 
                    dataKey={comparisonType === 'absolute' ? `avg_sourmash_${selectedMetric.toLowerCase().replace('-', '_')}` : `avg_${selectedMetric.toLowerCase().replace('-', '_')}_diff`}
                    fill={comparisonType === 'absolute' ? "#3b82f6" : "#ef4444"}
                  />
                  {comparisonType === 'difference' && (
                    <Line type="monotone" dataKey={() => 0} stroke="#000" strokeDasharray="3 3" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Win/Loss Summary */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Win Rate vs FCS+TIARA (F1-score)</h2>
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
                  <YAxis domain={[0, 1]} />
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

          {/* Summary Statistics Table */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Tool</th>
                    <th className="px-4 py-2 text-right">Avg F1 Diff</th>
                    <th className="px-4 py-2 text-right">Win Rate</th>
                    <th className="px-4 py-2 text-right">Wins</th>
                    <th className="px-4 py-2 text-right">Losses</th>
                    <th className="px-4 py-2 text-right">Avg Sourmash F1</th>
                    <th className="px-4 py-2 text-right">Avg FCS+TIARA F1</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedResults.map((result, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-25' : ''}>
                      <td className="px-4 py-2 text-sm">{formatToolName(result.tool)}</td>
                      <td className={`px-4 py-2 text-right text-sm font-mono ${result.avg_f1_diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.avg_f1_diff > 0 ? '+' : ''}{result.avg_f1_diff.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm">{(result.win_rate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">{result.wins}</td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">{result.losses}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono">{result.avg_sourmash_f1.toFixed(4)}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono">{result.avg_fcs_f1.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">Best Performing Sourmash Variants:</h3>
                <ul className="space-y-1">
                  {aggregatedResults.slice(0, 3).map((result, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{formatToolName(result.tool)}</span>
                      <span className="font-mono text-green-600">
                        +{result.avg_f1_diff.toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Comparison Summary:</h3>
                <ul className="space-y-1">
                  <li>Total variants tested: {aggregatedResults.length}</li>
                  <li>Variants outperforming FCS+TIARA: {aggregatedResults.filter(r => r.avg_f1_diff > 0).length}</li>
                  <li>Average improvement range: {Math.min(...aggregatedResults.map(r => r.avg_f1_diff)).toFixed(4)} to {Math.max(...aggregatedResults.map(r => r.avg_f1_diff)).toFixed(4)}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !uploadStatus && (
        <div className="text-center py-8 text-gray-500">
          Please upload a CSV file to view the comparison dashboard.
        </div>
      )}
    </div>
  );
};

export default ComparisonDashboard;
