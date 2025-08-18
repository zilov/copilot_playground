import React from 'react';

const DatasetManager = ({
  availableDatasets,
  currentDatasetName,
  uploadStatus,
  showFileUpload,
  setShowFileUpload,
  isDragOver,
  switchDataset,
  removeDataset,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInputChange,
  data
}) => {
  return (
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
  );
};

export default DatasetManager;
