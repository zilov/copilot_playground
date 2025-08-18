import { useState } from 'react';
import Papa from 'papaparse';

export const useDatasetManager = () => {
  const [data, setData] = useState(null);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [currentDatasetName, setCurrentDatasetName] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

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

  return {
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
  };
};
