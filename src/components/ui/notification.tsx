import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'info':
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-soft animate-in slide-in-from-right-5",
      getBgColor()
    )}>
      {getIcon()}
      <span className="text-sm font-medium text-foreground">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};