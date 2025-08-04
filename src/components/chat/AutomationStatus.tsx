import React from 'react';
import { Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationStatusProps {
  status: 'idle' | 'analyzing' | 'executing' | 'completed' | 'failed';
  currentStep?: string;
  toolName?: string;
  progress?: number;
}

export const AutomationStatus: React.FC<AutomationStatusProps> = ({
  status,
  currentStep,
  toolName,
  progress
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
      case 'executing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'analyzing':
        return 'Analyzing request...';
      case 'executing':
        return `Executing ${toolName || 'automation'}...`;
      case 'completed':
        return 'Automation completed';
      case 'failed':
        return 'Automation failed';
      default:
        return 'Ready for automation';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'analyzing':
      case 'executing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border',
      getStatusColor()
    )}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="text-sm font-medium">{getStatusText()}</div>
        {currentStep && (
          <div className="text-xs text-gray-600 mt-1">{currentStep}</div>
        )}
      </div>
      {progress !== undefined && status === 'executing' && (
        <div className="text-xs text-gray-600">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}; 