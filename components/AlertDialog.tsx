import React from 'react';

interface AlertDialogProps {
  show: boolean;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ show, message, type, onClose }) => {
  if (!show) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'critical':
        return {
          border: 'border-red-500',
          bg: 'bg-red-900/20',
          text: 'text-red-300',
          glow: 'shadow-[0_0_50px_rgba(239,68,68,0.8)]',
          icon: '🚨'
        };
      case 'warning':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-900/20',
          text: 'text-yellow-300',
          glow: 'shadow-[0_0_30px_rgba(234,179,8,0.6)]',
          icon: '⚠️'
        };
      case 'success':
        return {
          border: 'border-green-500',
          bg: 'bg-green-900/20',
          text: 'text-green-300',
          glow: 'shadow-[0_0_30px_rgba(34,197,94,0.6)]',
          icon: '✅'
        };
      default:
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-900/20',
          text: 'text-blue-300',
          glow: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-black ${styles.border} border-2 rounded-none p-6 max-w-2xl w-full ${styles.glow} ${type === 'critical' ? 'animate-pulse' : ''}`}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">{styles.icon}</div>
          <h2 className="text-2xl font-mono text-green-400 mb-2">
            {type === 'critical' ? 'BREAKING NEWS' : 
             type === 'warning' ? 'ECONOMIC ALERT' :
             type === 'success' ? 'ECONOMIC SUCCESS' : 'NEWS UPDATE'}
          </h2>
        </div>
        
        <div className={`${styles.bg} ${styles.border} border rounded-none p-4 mb-6`}>
          <p className={`${styles.text} font-mono text-sm leading-relaxed whitespace-pre-line`}>
            {message}
          </p>
        </div>
        
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-3 px-6 rounded-none transition-all duration-300 font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;