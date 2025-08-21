import { useMemo } from 'react';
import _ from 'lodash';

export const useDataProcessing = (data) => {
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
        // F1 wins/losses
        f1_wins: comparisons.filter(c => c.f1_diff > 0).length,
        f1_losses: comparisons.filter(c => c.f1_diff < 0).length,
        f1_ties: comparisons.filter(c => Math.abs(c.f1_diff) < 0.001).length,
        // Precision wins/losses
        precision_wins: comparisons.filter(c => c.precision_diff > 0).length,
        precision_losses: comparisons.filter(c => c.precision_diff < 0).length,
        precision_ties: comparisons.filter(c => Math.abs(c.precision_diff) < 0.001).length,
        // Recall wins/losses
        recall_wins: comparisons.filter(c => c.recall_diff > 0).length,
        recall_losses: comparisons.filter(c => c.recall_diff < 0).length,
        recall_ties: comparisons.filter(c => Math.abs(c.recall_diff) < 0.001).length,
        // Accuracy wins/losses
        accuracy_wins: comparisons.filter(c => c.accuracy_diff > 0).length,
        accuracy_losses: comparisons.filter(c => c.accuracy_diff < 0).length,
        accuracy_ties: comparisons.filter(c => Math.abs(c.accuracy_diff) < 0.001).length,
        // Legacy support (for backward compatibility)
        wins: comparisons.filter(c => c.f1_diff > 0).length,
        losses: comparisons.filter(c => c.f1_diff < 0).length,
        ties: comparisons.filter(c => Math.abs(c.f1_diff) < 0.001).length
      };
      
      // Calculate win rates for all metrics
      stats.f1_win_rate = stats.count > 0 ? stats.f1_wins / stats.count : 0;
      stats.precision_win_rate = stats.count > 0 ? stats.precision_wins / stats.count : 0;
      stats.recall_win_rate = stats.count > 0 ? stats.recall_wins / stats.count : 0;
      stats.accuracy_win_rate = stats.count > 0 ? stats.accuracy_wins / stats.count : 0;
      // Legacy support
      stats.win_rate = stats.f1_win_rate;
      
      return stats;
    }).filter(Boolean).sort((a, b) => b.avg_f1_diff - a.avg_f1_diff);

    console.log('Aggregated results:', results);
    return results;
  }, [processedData]);

  return {
    processedData,
    aggregatedResults
  };
};
