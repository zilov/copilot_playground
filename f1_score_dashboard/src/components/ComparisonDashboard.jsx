import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const ComparisonDashboard = () => {
  const [data, setData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('F1-score');
  const [comparisonType, setComparisonType] = useState('absolute');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [currentDatasetName, setCurrentDatasetName] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  // Новое состояние для просмотра отдельных образцов
  const [selectedSample, setSelectedSample] = useState('');
  const [sampleSearchTerm, setSampleSearchTerm] = useState('');

  // Получаем уникальные образцы (tolid) с фильтрацией по поиску
  const availableSamples = useMemo(() => {
    if (!data) return [];
    const samples = [...new Set(data.map(row => row.Tolid))].filter(Boolean).sort();
    
    if (!sampleSearchTerm) return samples;
    
    return samples.filter(sample => 
      sample.toLowerCase().includes(sampleSearchTerm.toLowerCase())
    );
  }, [data, sampleSearchTerm]);

  // Получаем данные для выбранного образца
  const sampleData = useMemo(() => {
    if (!data || !selectedSample) return [];
    return data.filter(row => row.Tolid === selectedSample);
  }, [data, selectedSample]);

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
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          // Clean and convert data
          const cleanedData = results.data
            .filter(row => row.ID && row.Tool && row['F1-score'])
            .map(row => {
              const cleanedRow = { ...row };
              ['Precision', 'Recall', 'Accuracy', 'F1-score'].forEach(key => {
                if (cleanedRow[key] !== undefined) {
                  cleanedRow[key] = parseFloat(cleanedRow[key]) || 0;
                }
              });
              return cleanedRow;
            });

          console.log('Cleaned data sample:', cleanedData.slice(0, 5));
          
          // Create dataset object
          const newDataset = {
            name: file.name,
            data: cleanedData,
            uploadedAt: new Date().toISOString(),
            isUploaded: true
          };

          // Add to available datasets
          setAvailableDatasets(prev => {
            const updated = [...prev.filter(d => d.name !== file.name), newDataset];
            return updated;
          });
          
          // Set as current dataset
          setData(cleanedData);
          setCurrentDatasetName(file.name);
          setIsFileUploaded(true);
          setUploadStatus(`Successfully loaded ${cleanedData.length} rows from ${file.name}`);
          setShowFileUpload(false);
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

  // Switch between datasets
  const switchDataset = (datasetName) => {
    const dataset = availableDatasets.find(d => d.name === datasetName);
    if (dataset) {
      setData(dataset.data);
      setCurrentDatasetName(datasetName);
      setIsFileUploaded(dataset.isUploaded);
      setUploadStatus(`Switched to ${datasetName} (${dataset.data.length} rows)`);
    }
  };

  // Remove dataset
  const removeDataset = (datasetName) => {
    setAvailableDatasets(prev => prev.filter(d => d.name !== datasetName));
    
    // If we're removing the current dataset, switch to another one
    if (currentDatasetName === datasetName) {
      const remaining = availableDatasets.filter(d => d.name !== datasetName);
      if (remaining.length > 0) {
        switchDataset(remaining[0].name);
      } else {
        setData(null);
        setCurrentDatasetName('');
        setIsFileUploaded(false);
        setUploadStatus('No datasets available');
        setShowFileUpload(true);
      }
    }
  };

  // Load default data if available
  const loadDefaultData = async () => {
    try {
      // Try to load the CSV file from public folder
      const response = await fetch('/f1_results.csv');
      if (!response.ok) {
        throw new Error('File not found');
      }
      const fileContent = await response.text();
      
      const parsedData = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      // Clean and convert data
      const cleanedData = parsedData.data
        .filter(row => row.ID && row.Tool && row['F1-score'])
        .map(row => {
          const cleanedRow = { ...row };
          ['Precision', 'Recall', 'Accuracy', 'F1-score'].forEach(key => {
            if (cleanedRow[key] !== undefined) {
              cleanedRow[key] = parseFloat(cleanedRow[key]) || 0;
            }
          });
          return cleanedRow;
        });

      console.log('Default data loaded:', cleanedData.slice(0, 5));
      
      // Create default dataset object
      const defaultDataset = {
        name: 'f1_results.csv (default)',
        data: cleanedData,
        uploadedAt: new Date().toISOString(),
        isUploaded: false
      };

      setAvailableDatasets([defaultDataset]);
      setData(cleanedData);
      setCurrentDatasetName('f1_results.csv (default)');
      setUploadStatus(`Loaded default data with ${cleanedData.length} rows`);
    } catch (error) {
      console.error('Error loading default data:', error);
      setUploadStatus('No default data available. Please upload a CSV file.');
      setShowFileUpload(true);
    }
  };

  // Process data for comparisons
  const processedData = useMemo(() => {
    if (!data) return null;

    console.log('Raw data:', data.slice(0, 5));

    // Group by ID/Tolid to get paired comparisons
    const groupedByDataset = _.groupBy(data, row => `${row.ID}-${row.Tolid}`);
    
    const comparisons = [];
    
    Object.entries(groupedByDataset).forEach(([datasetKey, rows]) => {
      const fcsResult = rows.find(r => r.Tool === 'FCS+TIARA' || r.Tool === 'fcs+tiara');
      const otherResults = rows.filter(r => r.Tool !== 'FCS+TIARA' && r.Tool !== 'fcs+tiara');
      
      if (fcsResult && otherResults.length > 0) {
        otherResults.forEach(toolResult => {
          // Check if all required values are valid numbers
          const fcsF1 = parseFloat(fcsResult['F1-score']);
          const toolF1 = parseFloat(toolResult['F1-score']);
          
          if (!isNaN(fcsF1) && !isNaN(toolF1)) {
            const comparison = {
              dataset: datasetKey,
              tool: toolResult.Tool,
              fcs_f1: fcsF1,
              fcs_precision: parseFloat(fcsResult.Precision) || 0,
              fcs_recall: parseFloat(fcsResult.Recall) || 0,
              fcs_accuracy: parseFloat(fcsResult.Accuracy) || 0,
              tool_f1: toolF1,
              tool_precision: parseFloat(toolResult.Precision) || 0,
              tool_recall: parseFloat(toolResult.Recall) || 0,
              tool_accuracy: parseFloat(toolResult.Accuracy) || 0,
              f1_diff: toolF1 - fcsF1,
              precision_diff: (parseFloat(toolResult.Precision) || 0) - (parseFloat(fcsResult.Precision) || 0),
              recall_diff: (parseFloat(toolResult.Recall) || 0) - (parseFloat(fcsResult.Recall) || 0),
              accuracy_diff: (parseFloat(toolResult.Accuracy) || 0) - (parseFloat(fcsResult.Accuracy) || 0),
              f1_ratio: fcsF1 !== 0 ? toolF1 / fcsF1 : 0,
              precision_ratio: (parseFloat(fcsResult.Precision) || 0) !== 0 ? (parseFloat(toolResult.Precision) || 0) / (parseFloat(fcsResult.Precision) || 0) : 0,
              recall_ratio: (parseFloat(fcsResult.Recall) || 0) !== 0 ? (parseFloat(toolResult.Recall) || 0) / (parseFloat(fcsResult.Recall) || 0) : 0,
              accuracy_ratio: (parseFloat(fcsResult.Accuracy) || 0) !== 0 ? (parseFloat(toolResult.Accuracy) || 0) / (parseFloat(fcsResult.Accuracy) || 0) : 0
            };
            comparisons.push(comparison);
          }
        });
      }
    });

    console.log('Processed comparisons:', comparisons.slice(0, 5));
    return comparisons;
  }, [data]);

  // Aggregate results by tool
  const aggregatedResults = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;

    const toolGroups = _.groupBy(processedData, 'tool');
    
    const results = Object.entries(toolGroups).map(([tool, comparisons]) => {
      if (comparisons.length === 0) return null;
      
      const stats = {
        tool: tool, // Keep tool name as is
        count: comparisons.length,
        avg_f1_diff: _.mean(comparisons.map(c => c.f1_diff)),
        avg_precision_diff: _.mean(comparisons.map(c => c.precision_diff)),
        avg_recall_diff: _.mean(comparisons.map(c => c.recall_diff)),
        avg_accuracy_diff: _.mean(comparisons.map(c => c.accuracy_diff)),
        avg_tool_f1: _.mean(comparisons.map(c => c.tool_f1)),
        avg_tool_precision: _.mean(comparisons.map(c => c.tool_precision)),
        avg_tool_recall: _.mean(comparisons.map(c => c.tool_recall)),
        avg_tool_accuracy: _.mean(comparisons.map(c => c.tool_accuracy)),
        avg_fcs_f1: _.mean(comparisons.map(c => c.fcs_f1)),
        wins: comparisons.filter(c => c.f1_diff > 0).length,
        losses: comparisons.filter(c => c.f1_diff < 0).length,
        ties: comparisons.filter(c => Math.abs(c.f1_diff) < 0.001).length
      };
      
      stats.win_rate = stats.count > 0 ? stats.wins / stats.count : 0;
      
      return stats;
    }).filter(Boolean).sort((a, b) => b.avg_f1_diff - a.avg_f1_diff);

    console.log('Aggregated results:', results);
    return results;
  }, [processedData]);

  React.useEffect(() => {
    if (availableDatasets.length === 0) {
      loadDefaultData();
    }
  }, []);

  // Автоматически выбираем первый образец при загрузке новых данных
  useEffect(() => {
    if (availableSamples.length > 0 && !selectedSample) {
      setSelectedSample(availableSamples[0]);
    }
  }, [availableSamples, selectedSample]);

  const getMetricKey = (metric, comparisonType) => {
    const metricMap = {
      'F1-score': comparisonType === 'absolute' ? 'avg_tool_f1' : 'avg_f1_diff',
      'Precision': comparisonType === 'absolute' ? 'avg_tool_precision' : 'avg_precision_diff',
      'Recall': comparisonType === 'absolute' ? 'avg_tool_recall' : 'avg_recall_diff',
      'Accuracy': comparisonType === 'absolute' ? 'avg_tool_accuracy' : 'avg_accuracy_diff'
    };
    return metricMap[metric] || 'avg_f1_diff';
  };

  const getMetricValue = (item, metric) => {
    switch(metric) {
      case 'F1-score': return comparisonType === 'absolute' ? item.avg_tool_f1 : item.avg_f1_diff;
      case 'Precision': return comparisonType === 'absolute' ? item.avg_tool_precision : item.avg_precision_diff;
      case 'Recall': return comparisonType === 'absolute' ? item.avg_tool_recall : item.avg_recall_diff;
      case 'Accuracy': return comparisonType === 'absolute' ? item.avg_tool_accuracy : item.avg_accuracy_diff;
      default: return item.avg_f1_diff;
    }
  };

  const formatToolName = (tool) => {
    // Keep tool names as they are, just clean up underscores for better readability
    return tool.replace(/_/g, ' ');
  };

  // Функция для экспорта данных образца в CSV
  const exportSampleData = () => {
    if (!selectedSample || sampleData.length === 0) return;
    
    // Подготавливаем данные для экспорта
    const exportData = sampleData.map(row => ({
      'Sample ID': row.ID || '',
      'Tolid': row.Tolid || '',
      'Tool': row.Tool || '',
      'F1-score': parseFloat(row['F1-score']) || 0,
      'Precision': parseFloat(row['Precision']) || 0,
      'Recall': parseFloat(row['Recall']) || 0,
      'Accuracy': parseFloat(row['Accuracy']) || 0,
      'True Positives (TP)': row['True Positives (TP)'] || 0,
      'False Positives (FP)': row['False Positives (FP)'] || 0,
      'False Negatives (FN)': row['False Negatives (FN)'] || 0,
      'True Negatives (TN)': row['True Negatives (TN)'] || 0
    }));
    
    // Конвертируем в CSV
    const csv = Papa.unparse(exportData);
    
    // Создаем и скачиваем файл
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sample_${selectedSample}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data && !uploadStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tool Performance Comparison Dashboard</h1>
      
      {/* Dataset Management Section */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Data Management</h2>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload New File
          </button>
        </div>

        {/* Available Datasets */}
        {availableDatasets.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Available Datasets ({availableDatasets.length})</h3>
            <div className="space-y-2">
              {availableDatasets.map((dataset) => (
                <div 
                  key={dataset.name}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    currentDatasetName === dataset.name 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      currentDatasetName === dataset.name ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm">{dataset.name}</div>
                      <div className="text-xs text-gray-500">
                        {dataset.data.length} rows • {dataset.isUploaded ? 'Uploaded' : 'Default'} • 
                        {new Date(dataset.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentDatasetName !== dataset.name && (
                      <button
                        onClick={() => switchDataset(dataset.name)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        Switch to
                      </button>
                    )}
                    {currentDatasetName === dataset.name && (
                      <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                        Active
                      </span>
                    )}
                    {availableDatasets.length > 1 && (
                      <button
                        onClick={() => removeDataset(dataset.name)}
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {(showFileUpload || !data) && (
          <div className="border-t pt-4">
            <h3 className="text-md font-medium mb-4">Upload New Dataset</h3>
            
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
                uploadStatus.includes('Successfully') || uploadStatus.includes('Loaded default') || uploadStatus.includes('Switched')
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
      </div>

      {data && !processedData && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          <p>Data loaded but no valid comparisons found. Please check that your CSV contains:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>A row with Tool = "FCS+TIARA" (baseline tool)</li>
            <li>Rows with other tools to compare against the baseline</li>
            <li>Valid numeric values for F1-score, Precision, Recall, Accuracy</li>
          </ul>
        </div>
      )}

      {data && processedData && !aggregatedResults && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          <p>Comparisons processed but no aggregated results. Please check data integrity.</p>
        </div>
      )}

      {data && processedData && aggregatedResults && (
        <>
          {/* Debug info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm space-y-1">
            <div><strong>Debug info:</strong></div>
            <div>• Loaded {data.length} rows</div>
            <div>• Found {processedData.length} valid comparisons</div>
            <div>• Aggregated {aggregatedResults.length} tools</div>
            {aggregatedResults.length > 0 && (
              <div>• Sample F1 values: {aggregatedResults.slice(0, 3).map(r => `${r.tool}: ${r.avg_tool_f1?.toFixed(3) || 'N/A'}`).join(', ')}</div>
            )}
          </div>

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
                <option value="difference">Difference from Baseline</option>
              </select>
            </div>
          </div>

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
                      <Cell key={`cell-${index}`} fill={getMetricValue(entry, selectedMetric) > 0 ? "#22c55e" : "#ef4444"} />
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
                      <td className="px-4 py-2 text-right text-sm">{((result.win_rate || 0) * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">{result.wins || 0}</td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">{result.losses || 0}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono">{(result.avg_tool_f1 || 0).toFixed(3)}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono">{(result.avg_fcs_f1 || 0).toFixed(3)}</td>
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
        </>
      )}

      {/* Sample Details Section */}
      {data && aggregatedResults && (
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
                    onClick={() => {
                      const currentIndex = availableSamples.indexOf(selectedSample);
                      if (currentIndex > 0) {
                        setSelectedSample(availableSamples[currentIndex - 1]);
                      }
                    }}
                    disabled={availableSamples.indexOf(selectedSample) === 0}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = availableSamples.indexOf(selectedSample);
                      if (currentIndex < availableSamples.length - 1) {
                        setSelectedSample(availableSamples[currentIndex + 1]);
                      }
                    }}
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
                  onClick={() => {
                    setSampleSearchTerm('');
                    setSelectedSample('');
                  }}
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
      )}

      {!data && uploadStatus && uploadStatus.includes('No default data') && (
        <div className="text-center py-8 text-gray-500">
          Please upload a CSV file to view the comparison dashboard.
        </div>
      )}
    </div>
  );
};

export default ComparisonDashboard;
