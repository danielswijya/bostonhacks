import React from 'react';

interface EndOfDayModalProps {
  day: number;
  stats: {
    correct: number;
    incorrect: number;
  };
  onNextDay: () => void;
}

const EndOfDayModal: React.FC<EndOfDayModalProps> = ({ day, stats, onNextDay }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 border border-green-500 rounded-lg shadow-2xl p-8 max-w-lg w-full text-center">
        <h2 className="text-5xl font-display text-green-600 dark:text-green-400 mb-4">End of Day {day}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your shift is over. Here is your performance summary.</p>
        
        <div className="text-left bg-gray-100 dark:bg-gray-900 p-4 rounded-md space-y-3 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex justify-between items-center text-xl">
                <p className="text-gray-700 dark:text-gray-300">Cases Resolved:</p>
                <p className="font-bold text-gray-900 dark:text-white">{stats.correct + stats.incorrect}</p>
            </div>
             <hr className="border-gray-300 dark:border-gray-600"/>
            <div className="flex justify-between items-center text-xl">
                <p className="text-green-600 dark:text-green-400">Correct Decisions:</p>
                <p className="font-bold text-green-600 dark:text-green-400">{stats.correct}</p>
            </div>
            <div className="flex justify-between items-center text-xl">
                <p className="text-red-600 dark:text-red-400">Incorrect Decisions:</p>
                <p className="font-bold text-red-600 dark:text-red-400">{stats.incorrect}</p>
            </div>
        </div>

        <button 
            onClick={onNextDay} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-2xl font-display"
        >
            Start Day {day + 1}
        </button>
      </div>
    </div>
  );
};

export default EndOfDayModal;