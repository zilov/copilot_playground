import React, { useState, useEffect } from 'react';

// Hooks
import { useDatasetManager } from '../hooks/useDatasetManager';
import { useDataProcessing } from '../hooks/useDataProcessing';
import { useSampleAnalysis } from '../hooks/useSampleAnalysis';

// Components
import DatasetManager from './DatasetManager';
import ChartsSection from './ChartsSection';
import SummaryStatistics from './SummaryStatistics';
import KeyInsights from './KeyInsights';
import SampleDetailsSection from './SampleDetailsSection';

const ComparisonDashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState('F1-score');
  const [comparisonType, setComparisonType] = useState('absolute');

  // Dataset management
  const {
    data,
    availableDatasets,
    currentDatasetName,
    isFileUploaded,
    uploadStatus,
    isDragOver,
    showFileUpload,
    setShowFileUpload,
    handleFileUpload,
    switchDataset,
    removeDataset,
    loadDefaultData,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange
  } = useDatasetManager();

  // Data processing
  const { processedData, aggregatedResults } = useDataProcessing(data);

  // Sample analysis
  const {
    selectedSample,
    setSelectedSample,
    sampleSearchTerm,
    setSampleSearchTerm,
    availableSamples,
    sampleData,
    exportSampleData,
    clearSearch,
    navigateSample
  } = useSampleAnalysis(data);

  // Load default data on component mount
  useEffect(() => {
    if (availableDatasets.length === 0) {
      loadDefaultData();
    }
  }, [availableDatasets.length, loadDefaultData]);
  // Loading state
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
      <DatasetManager
        availableDatasets={availableDatasets}
        currentDatasetName={currentDatasetName}
        uploadStatus={uploadStatus}
        showFileUpload={showFileUpload}
        setShowFileUpload={setShowFileUpload}
        isDragOver={isDragOver}
        switchDataset={switchDataset}
        removeDataset={removeDataset}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        handleFileInputChange={handleFileInputChange}
        data={data}
      />

      {/* Warning messages */}
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

      {/* Main Dashboard Content */}
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

          {/* Metric and Comparison Type Selectors */}
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

          {/* Charts Section */}
          <ChartsSection 
            aggregatedResults={aggregatedResults}
            selectedMetric={selectedMetric}
            comparisonType={comparisonType}
          />

          {/* Summary Statistics */}
          <SummaryStatistics aggregatedResults={aggregatedResults} />

          {/* Key Insights */}
          <KeyInsights aggregatedResults={aggregatedResults} />
        </>
      )}

      {/* Sample Details Section */}
      <SampleDetailsSection 
        data={data}
        aggregatedResults={aggregatedResults}
        selectedSample={selectedSample}
        setSelectedSample={setSelectedSample}
        sampleSearchTerm={sampleSearchTerm}
        setSampleSearchTerm={setSampleSearchTerm}
        availableSamples={availableSamples}
        sampleData={sampleData}
        exportSampleData={exportSampleData}
        clearSearch={clearSearch}
        navigateSample={navigateSample}
      />

      {/* No data message */}
      {!data && uploadStatus && uploadStatus.includes('No default data') && (
        <div className="text-center py-8 text-gray-500">
          Please upload a CSV file to view the comparison dashboard.
        </div>
      )}
    </div>
  );
};

export default ComparisonDashboard;
