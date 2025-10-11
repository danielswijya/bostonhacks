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
    const outcomeBg = isCorrect ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500';
    const outcomeText = isCorrect ? 'text-green-400' : 'text-red-400';

    return (
        <div className={`p-3 rounded-none border-2 ${outcomeBg} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-green-300 font-mono">{scenario.customerName}</p>
                    <p className="text-sm text-green-600 font-mono">{scenario.transactionType}</p>
                </div>
                <div className="text-right">
                    <p className={`font-bold font-mono ${outcomeText}`}>{isCorrect ? 'CORRECT' : 'INCORRECT'}</p>
                    <p className="text-sm text-green-400 font-mono">You <span className="font-semibold">{playerDecision}</span></p>
                </div>
            </div>
            <p className="mt-2 text-xs text-green-400 bg-black p-2 rounded-none border border-green-700 font-mono">
                <span className="font-bold">RATIONALE:</span> {scenario.scamRationale}
            </p>
        </div>
    );
};

const EndOfDayModal: React.FC<EndOfDayModalProps> = ({ day, stats, onNextDay, resolvedCases }) => {  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 animate-zoom-in">
      <div className="bg-black border-2 border-green-500 rounded-none shadow-[0_0_50px_rgba(34,197,94,0.8)] p-6 max-w-2xl w-full flex flex-col max-h-[90vh]">
        <h2 className="text-4xl font-mono text-green-400 mb-2 text-center tracking-wider">END OF DAY {day} DEBRIEFING</h2>
        <p className="text-green-600 mb-4 text-center font-mono">The market is closed. Review your performance.</p>
        
        <div className="flex-grow overflow-y-auto bg-black p-4 rounded-none space-y-3 border-2 border-green-500 mb-4 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
            {resolvedCases.map((rc, index) => (
                <CaseRecap key={index} resolvedCase={rc} />
            ))}
        </div>

        <div className="text-left bg-black p-4 rounded-none border-2 border-green-500 mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <h3 className="font-mono text-2xl mb-2 text-green-400 tracking-wider">PERFORMANCE SUMMARY</h3>
            <div className="flex justify-between items-center text-lg font-mono">
                <p className="text-green-400">Correct Decisions:</p>
                <p className="font-bold text-green-300">{stats.correct}</p>
            </div>
            <div className="flex justify-between items-center text-lg font-mono">
                <p className="text-red-400">Incorrect Decisions:</p>
                <p className="font-bold text-red-300">{stats.incorrect}</p>
            </div>
             <hr className="my-2 border-green-600"/>
            <div className="flex justify-between items-center text-lg font-mono">
                <p className="text-green-400">Total Capital Lost:</p>
                <p className="font-bold font-mono text-red-400">{formatCurrency(stats.capitalLost)}</p>
            </div>
        </div>

        <button 
            onClick={onNextDay} 
            className="w-full bg-blue-700 hover:bg-blue-600 text-blue-100 font-bold py-3 px-6 rounded-none transition-all duration-300 text-2xl font-mono border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
            START TRADING DAY {day + 1}
        </button>
      </div>
    </div>
  );
};

export default EndOfDayModal;