import React, { useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface MarketTickerProps {
    capital: number;
    maxCapital: number;
    history: number[];
    toggleTheme: () => void;
    theme: Theme;
    isLeaking: boolean;
    day: number;
    casesToday: number;
    casesPerDay: number;
}

const ThemeToggle: React.FC<{ onClick: () => void; theme: Theme }> = ({ onClick, theme }) => (
    <button
        onClick={onClick}
        className="p-2 rounded border border-green-500 text-green-400 hover:bg-green-500 hover:text-black focus:outline-none transition-colors duration-300"
        aria-label="Toggle theme"
    >
        {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        )}
    </button>
);


const generateTickerData = (count: number) => {
    const symbols = ["AGB", "FCN", "TRX", "CYB", "SEC", "WFG", "GLD", "FIN", "BNK", "INV"];
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        symbol: symbols[i % symbols.length],
        price: (Math.random() * 500 + 50).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
    }));
};

const StockGraph: React.FC<{ history: number[], theme: Theme }> = ({ history, theme }) => {
    const width = 200;
    const height = 40;
    const padding = 2;

    const pathData = useMemo(() => {
        if (history.length < 2) return "";

        const maxVal = Math.max(...history);
        const minVal = Math.min(...history);
        const range = maxVal - minVal || 1;

        return history.map((val, i) => {
            const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
            const y = height - ((val - minVal) / range) * (height - padding * 2) - padding;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join(' ');
    }, [history]);

    const strokeColor = theme === 'dark' ? '#22c55e' : '#16a34a';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
    );
};

const MarketTicker: React.FC<MarketTickerProps> = ({ capital, maxCapital, history, toggleTheme, theme, isLeaking, day, casesToday, casesPerDay }) => {
    const [tickerData, setTickerData] = useState(() => generateTickerData(20));

    useEffect(() => {
        const interval = setInterval(() => {
            setTickerData(prevData =>
                prevData.map(item => {
                    const price = parseFloat(item.price);
                    const changeDirection = Math.random() > 0.5 ? 1 : -1;
                    const newPrice = price + changeDirection * (Math.random() * 0.5);
                    return {
                        ...item,
                        price: newPrice.toFixed(2),
                        change: (parseFloat(item.change) + (newPrice - price)).toFixed(2),
                    };
                })
            );
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const capitalPercentage = (capital / maxCapital) * 100;
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };    return (
        <header className="relative z-50 bg-black p-3 rounded-none shadow-2xl border-2 border-green-500 bg-opacity-100 shadow-green-500/20 mb-4">
            {/* First Row - Game Info and Controls */}
            <div className="flex justify-between items-center mb-2 px-2">
                <h1 className="text-2xl font-display text-green-400 font-bold tracking-wider">AEGIS SENTINEL // FCU</h1>

                 <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">DAY</p>
                            <p className="font-bold text-green-400 font-mono text-lg">{day}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">CASE</p>
                            <p className="font-bold text-green-400 font-mono text-lg">{casesToday + 1}/{casesPerDay}</p>
                        </div>
                    </div>
                    
                    <ThemeToggle onClick={toggleTheme} theme={theme} />
                 </div>
            </div>
              {/* Second Row - Prominent Capital Display */}
            <div className="text-center mb-4">
                <p className={`text-xs uppercase tracking-wide mb-1 font-bold ${isLeaking ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                    STATE CAPITAL
                </p>
                <p className={`text-6xl font-bold font-mono ${isLeaking ? 'text-red-400 animate-pulse shadow-red-500/50' : 'text-green-400 shadow-green-500/50'} drop-shadow-lg`}>
                    {formatCurrency(capital)}
                </p>
                <div className="w-40 mx-auto bg-gray-800 border border-green-500 rounded-full h-3 mt-3">
                    <div className={`${isLeaking ? 'bg-red-500 shadow-red-500/50' : 'bg-green-500 shadow-green-500/50'} h-3 rounded-full transition-all duration-500 shadow-lg`} style={{ width: `${capitalPercentage}%` }}></div>
                </div>
            </div>

            <div className="w-full bg-black border-2 border-green-500 text-green-400 overflow-hidden whitespace-nowrap text-sm font-mono shadow-inner">
                <div className="inline-block animate-[ticker_40s_linear_infinite]">
                    {tickerData.map(item => (
                        <span key={item.id} className="inline-block px-4 py-1 border-r border-green-600">
                            {item.symbol}{' '}
                            <span className={parseFloat(item.change) >= 0 ? 'text-green-300' : 'text-red-400'}>
                                {item.price}
                                {parseFloat(item.change) >= 0 ? ' ▲' : ' ▼'}
                                {item.change}
                            </span>
                        </span>
                    ))}
                     {tickerData.map(item => (
                        <span key={`${item.id}-clone`} className="inline-block px-4 py-1 border-r border-green-600">
                            {item.symbol}{' '}
                            <span className={parseFloat(item.change) >= 0 ? 'text-green-300' : 'text-red-400'}>
                                {item.price}
                                {parseFloat(item.change) >= 0 ? ' ▲' : ' ▼'}
                                {item.change}
                            </span>
                        </span>
                    ))}
                </div>
                 <style>{`
                    @keyframes ticker {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}</style>
            </div>
        </header>
    );
};

export default MarketTicker;
