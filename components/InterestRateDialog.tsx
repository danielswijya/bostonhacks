import React, { useState } from 'react';

interface InterestRateDialogProps {
  onSetRate: (rate: number) => void;
  minRate: number;
  maxRate: number;
  currentRate: number;
}

const InterestRateDialog: React.FC<InterestRateDialogProps> = ({ 
  onSetRate, 
  minRate, 
  maxRate, 
  currentRate 
}) => {
  const [selectedRate, setSelectedRate] = useState(currentRate);

  const handleSubmit = () => {
    onSetRate(selectedRate);
  };

  const presetRates = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-black border-2 border-green-500 rounded-none shadow-[0_0_50px_rgba(34,197,94,0.8)] p-8 max-w-2xl w-full">
        <h2 className="text-4xl font-mono text-green-400 mb-4 text-center tracking-wider">
          FEDERAL RESERVE INTEREST RATE SETTING
        </h2>
        
        <div className="bg-black p-4 rounded-none mb-6 border-2 border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
          <p className="text-green-300 text-center font-mono text-lg mb-4">
            Set the daily interest rate for economic operations. Once locked, this rate cannot be changed during the trading day.
          </p>
          
          <div className="text-center mb-6">
            <p className="text-green-600 font-mono text-sm mb-2">CURRENT SELECTION</p>
            <p className="text-6xl font-bold text-green-400 font-mono">
              {selectedRate.toFixed(1)}%
            </p>
          </div>

          {/* Rate Slider */}
          <div className="mb-6">
            <input
              type="range"
              min={minRate}
              max={maxRate}
              step={0.1}
              value={selectedRate}
              onChange={(e) => setSelectedRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-green-600 font-mono mt-1">
              <span>{minRate}%</span>
              <span>{maxRate}%</span>
            </div>
          </div>

          {/* Preset Rate Buttons */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {presetRates.map(rate => (
              <button
                key={rate}
                onClick={() => setSelectedRate(rate)}
                className={`py-2 px-3 font-mono text-sm border rounded-none transition-colors ${
                  selectedRate === rate 
                    ? 'bg-green-700 border-green-500 text-green-100' 
                    : 'bg-gray-800 border-gray-600 text-green-400 hover:bg-gray-700'
                }`}
              >
                {rate.toFixed(1)}%
              </button>
            ))}
          </div>

          {/* Economic Impact Preview */}
          <div className="bg-gray-900 border border-green-600 p-3 rounded-none mb-6">
            <p className="text-green-400 font-mono text-sm font-bold mb-2">ECONOMIC IMPACT PREVIEW:</p>
            <div className="text-xs font-mono text-green-300">
              {selectedRate <= 2.5 && (
                <p>• Very Low Rates: Strong market growth, high inflation risk</p>
              )}
              {selectedRate > 2.5 && selectedRate <= 4.0 && (
                <p>• Low Rates: Moderate growth, balanced inflation</p>
              )}
              {selectedRate > 4.0 && selectedRate <= 5.0 && (
                <p>• Moderate Rates: Economic uncertainty zone, high volatility</p>
              )}
              {selectedRate > 5.0 && selectedRate <= 6.5 && (
                <p>• High Rates: Market stress, inflation control</p>
              )}
              {selectedRate > 6.5 && (
                <p>• Very High Rates: Strong market decline, crisis risk</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-4 px-8 rounded-none transition-all duration-300 font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] text-xl tracking-wider"
          >
            LOCK INTEREST RATE FOR TODAY
          </button>
          <p className="text-green-600 font-mono text-xs mt-2">
            ⚠️ WARNING: Rate cannot be changed once locked
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterestRateDialog;
