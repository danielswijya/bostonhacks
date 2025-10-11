import React from 'react';
import { ResolvedCase } from '../types';

interface EndOfDayModalProps {
  day: number;
  stats: {
    correct: number;
    incorrect: number;
    capitalLost: number;
  };
  onNextDay: () => void;
  resolvedCases: ResolvedCase[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const CaseRecap: React.FC<{ resolvedCase: ResolvedCase }> = ({ resolvedCase }) => {
    const { scenario, playerDecision, isCorrect } = resolvedCase;
    const outcomeBg = isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50';
    const outcomeText = isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    return (
        <div className={`p-3 rounded-lg ${outcomeBg}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{scenario.customerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.transactionType}</p>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${outcomeText}`}>{isCorrect ? 'CORRECT' : 'INCORRECT'}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">You <span className="font-semibold">{playerDecision}</span></p>
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 p-2 rounded-md">
                <span className="font-bold">Rationale:</span> {scenario.scamRationale}
            </p>
        </div>
    );
};

const EndOfDayModal: React.FC<EndOfDayModalProps> = ({ day, stats, onNextDay, resolvedCases }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-zoom-in">
      <div className="bg-white dark:bg-gray-800 border border-green-500 rounded-lg shadow-2xl p-6 max-w-2xl w-full flex flex-col max-h-[90vh]">
        <h2 className="text-4xl font-display text-green-600 dark:text-green-400 mb-2 text-center">End of Day {day} Debriefing</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">The market is closed. Review your performance.</p>
        
        <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-md space-y-3 border border-gray-200 dark:border-gray-700 mb-4">
            {resolvedCases.map((rc, index) => (
                <CaseRecap key={index} resolvedCase={rc} />
            ))}
        </div>

        <div className="text-left bg-gray-100 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="font-display text-2xl mb-2 text-gray-800 dark:text-gray-200">Performance Summary</h3>
            <div className="flex justify-between items-center text-lg">
                <p className="text-green-600 dark:text-green-400">Correct Decisions:</p>
                <p className="font-bold text-green-600 dark:text-green-400">{stats.correct}</p>
            </div>
            <div className="flex justify-between items-center text-lg">
                <p className="text-red-600 dark:text-red-400">Incorrect Decisions:</p>
                <p className="font-bold text-red-600 dark:text-red-400">{stats.incorrect}</p>
            </div>
             <hr className="my-2 border-gray-300 dark:border-gray-600"/>
            <div className="flex justify-between items-center text-lg">
                <p className="text-gray-700 dark:text-gray-300">Total Capital Lost:</p>
                <p className="font-bold font-mono text-red-500">{formatCurrency(stats.capitalLost)}</p>
            </div>
        </div>

        <button 
            onClick={onNextDay} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-2xl font-display"
        >
            Start Trading Day {day + 1}
        </button>
      </div>
    </div>
  );
};

export default EndOfDayModal;