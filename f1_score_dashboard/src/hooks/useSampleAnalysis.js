import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';

export const useSampleAnalysis = (data) => {
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

  // Автоматически выбираем первый образец при загрузке новых данных
  useEffect(() => {
    if (availableSamples.length > 0 && !selectedSample) {
      setSelectedSample(availableSamples[0]);
    }
  }, [availableSamples, selectedSample]);

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

  const clearSearch = () => {
    setSampleSearchTerm('');
    setSelectedSample('');
  };

  const navigateSample = (direction) => {
    const currentIndex = availableSamples.indexOf(selectedSample);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedSample(availableSamples[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableSamples.length - 1) {
      setSelectedSample(availableSamples[currentIndex + 1]);
    }
  };

  return {
    selectedSample,
    setSelectedSample,
    sampleSearchTerm,
    setSampleSearchTerm,
    availableSamples,
    sampleData,
    exportSampleData,
    clearSearch,
    navigateSample
  };
};
