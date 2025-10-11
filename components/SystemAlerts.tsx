import React, { useEffect } from 'react';
import { SystemAlert } from '../types';

interface SystemAlertsProps {
  alerts: SystemAlert[];
  onDismiss: (id: number) => void;
}

const Alert: React.FC<{ alert: SystemAlert; onDismiss: (id: number) => void }> = ({ alert, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(alert.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'error':
        return 'bg-red-500 border-red-700';
      case 'success':
        return 'bg-green-500 border-green-700';
      case 'info':
      default:
        return 'bg-blue-500 border-blue-700';
    }
  };

  return (
    <div 
      className={`relative w-80 p-4 mb-4 text-white rounded-lg shadow-lg border-l-4 animate-slide-in-bottom ${getAlertStyles()}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 13v-4h2v4H9zm0-6h2v2H9V7z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">SYSTEM ALERT</p>
          <p className="text-sm">{alert.message}</p>
        </div>
      </div>
       <button onClick={() => onDismiss(alert.id)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Dismiss alert">
            <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
        </button>
    </div>
  );
};

const SystemAlerts: React.FC<SystemAlertsProps> = ({ alerts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {alerts.map(alert => (
        <Alert key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default SystemAlerts;
