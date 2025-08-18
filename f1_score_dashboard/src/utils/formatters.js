export const formatToolName = (tool) => {
  // Keep tool names as they are, just clean up underscores for better readability
  return tool.replace(/_/g, ' ');
};

export const getMetricKey = (metric, comparisonType) => {
  const metricMap = {
    'F1-score': comparisonType === 'absolute' ? 'avg_tool_f1' : 'avg_f1_diff',
    'Precision': comparisonType === 'absolute' ? 'avg_tool_precision' : 'avg_precision_diff',
    'Recall': comparisonType === 'absolute' ? 'avg_tool_recall' : 'avg_recall_diff',
    'Accuracy': comparisonType === 'absolute' ? 'avg_tool_accuracy' : 'avg_accuracy_diff'
  };
  return metricMap[metric] || 'avg_f1_diff';
};

export const getMetricValue = (item, metric, comparisonType) => {
  switch(metric) {
    case 'F1-score': return comparisonType === 'absolute' ? item.avg_tool_f1 : item.avg_f1_diff;
    case 'Precision': return comparisonType === 'absolute' ? item.avg_tool_precision : item.avg_precision_diff;
    case 'Recall': return comparisonType === 'absolute' ? item.avg_tool_recall : item.avg_recall_diff;
    case 'Accuracy': return comparisonType === 'absolute' ? item.avg_tool_accuracy : item.avg_accuracy_diff;
    default: return item.avg_f1_diff;
  }
};
