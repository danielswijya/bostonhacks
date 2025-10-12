import React from 'react';

interface NewsletterDialogProps {
  show: boolean;
  content: string;
  day: number;
  onClose: () => void;
}

const NewsletterDialog: React.FC<NewsletterDialogProps> = ({ show, content, day, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-2 border-green-500 rounded-none p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_40px_rgba(34,197,94,0.7)]">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-mono text-green-400 mb-2 tracking-wider">INTELLIGENCE DAILY</h1>
          <h2 className="text-xl font-mono text-green-300 border-b border-green-500 pb-2">
            DAY {day} OPERATIONAL SUMMARY
          </h2>
          <p className="text-sm text-green-600 font-mono mt-2">CLASSIFIED BRIEFING DOCUMENT</p>
        </div>

        <div className="bg-gray-900 border border-green-500 rounded-none p-6 mb-6">
          <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={onClose}
            className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-4 px-8 rounded-none transition-all duration-300 font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] text-lg tracking-wider"
          >
            CONTINUE MISSION
          </button>
          <p className="text-green-600 font-mono text-xs">Press to proceed to next operational day</p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterDialog;