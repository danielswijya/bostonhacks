import React, { useState, useEffect, useMemo } from 'react';
import capitolImage from '../src/img/Gemini_Generated_Image_82j5vg82j5vg82j5.png';

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
    interestRate?: number;
    economicCycle?: 'growth' | 'recession' | 'crisis';
    lastEconomicEvent?: string;
    activeEvent?: string | null;
    eventTimeRemaining?: number;
    onAdjustInterestRate?: (change: number) => void;
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
        change: "0.00", // Start with zero change - will be calculated per tick
        previousPrice: (Math.random() * 500 + 50), // Track previous price for change calculation
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

const MarketTicker: React.FC<MarketTickerProps> = ({ 
    capital, maxCapital, history, toggleTheme, theme, isLeaking, day, casesToday, casesPerDay,
    interestRate = 5.0, economicCycle = 'growth', lastEconomicEvent = '', 
    activeEvent = null, eventTimeRemaining = 0, onAdjustInterestRate 
}) => {
    const [tickerData, setTickerData] = useState(() => generateTickerData(20));      useEffect(() => {
        const interval = setInterval(() => {
            setTickerData(prevData =>
                prevData.map(item => {
                    const currentPrice = parseFloat(item.price);
                    const previousPrice = item.previousPrice || currentPrice;
                    
                    // Economic factors affecting stock prices
                    let baseVolatility = 0.8; // Base volatility
                    
                    // SPECIAL CASE: Interest rate between 4% and 5% (uncertainty zone)
                    if (interestRate >= 4.0 && interestRate <= 5.0) {
                        // Asymmetric range: -1.50 to +0.50 (bearish bias)
                        const uncertaintyEffect = (Math.random() * 2.0) - 1.5; // Range: -1.5 to +0.5
                        baseVolatility = 1.2; // Higher volatility in uncertainty zone
                        
                        const priceChange = uncertaintyEffect * (Math.random() * baseVolatility);
                        const newPrice = Math.max(0.01, currentPrice + priceChange);
                        
                        return {
                            ...item,
                            price: newPrice.toFixed(2),
                            change: (newPrice - previousPrice).toFixed(2), // Change from previous tick
                            previousPrice: currentPrice, // Store current as previous for next tick
                        };
                    }
                    
                    // NORMAL CASE: Interest rate outside 4-5% range
                    // IMMEDIATE Interest rate effect on stocks (inverse relationship)
                    // Higher rates = stocks become less attractive vs bonds (IMMEDIATE DROP)
                    // Lower rates = stocks become more attractive (IMMEDIATE RISE)
                    // Fix the rate effect logic to cover all cases properly
                    const rateEffect = interestRate >= 7 ? -0.6 :    // High rates: strong negative (>= not >)
                                      interestRate > 5 ? -0.2 :      // Above uncertainty zone: mild negative  
                                      interestRate <= 2 ? 0.7 :      // Very low rates: strong positive (<= not <)
                                      interestRate < 4 ? 0.3 : 0;    // Below uncertainty zone: mild positive
                    
                    // Economic cycle effect
                    const cycleEffect = economicCycle === 'growth' ? 0.4 :
                                       economicCycle === 'recession' ? -0.5 :
                                       economicCycle === 'crisis' ? -0.8 : 0;
                    
                    // Active event effect (stronger impact)
                    const eventEffect = activeEvent ? 
                        (activeEvent.includes('Rally') || activeEvent.includes('Boom') ? 0.8 :
                         activeEvent.includes('Crisis') || activeEvent.includes('War') ? -0.9 : 
                         activeEvent.includes('Inflation') ? -0.4 : 0) : 0;
                    
                    // Combine all effects with stronger influence
                    const totalEffect = rateEffect + cycleEffect + eventEffect;
                    
                    // Calculate price change with immediate reaction
                    const changeDirection = Math.random() - 0.5 + (totalEffect * 0.8); // 80% of effect applied immediately
                    const volatility = baseVolatility * (1 + Math.abs(totalEffect * 1.5)); // More volatility during extreme conditions
                    
                    const priceChange = changeDirection * (Math.random() * volatility);
                    const newPrice = Math.max(0.01, currentPrice + priceChange); // Minimum price of $0.01
                    
                    return {
                        ...item,
                        price: newPrice.toFixed(2),
                        change: (newPrice - previousPrice).toFixed(2), // Change from previous tick only
                        previousPrice: currentPrice, // Store current as previous for next tick
                    };
                })
            );
        }, 1000); // Updates every second for immediate reaction
        
        return () => clearInterval(interval);
    }, [interestRate, economicCycle, activeEvent]);    
    useEffect(() => {
        const interval = setInterval(() => {
            setTickerData(prevData =>
                prevData.map(item => {
                    const price = parseFloat(item.price);
                    
                    // Economic factors affecting stock prices
                    let baseVolatility = 0.8;
                    
                    // SPECIAL CASE: Interest rate between 4% and 5% (uncertainty zone)
                    if (interestRate >= 4.0 && interestRate <= 5.0) {
                        // Asymmetric range: -1.50 to +0.50 (bearish bias)
                        const uncertaintyEffect = (Math.random() * 2.0) - 1.5; // Range: -1.5 to +0.5
                        baseVolatility = 1.2; // Higher volatility in uncertainty zone
                        
                        const priceChange = uncertaintyEffect * (Math.random() * baseVolatility);
                        const newPrice = Math.max(0.01, price + priceChange);
                        
                        return {
                            ...item,
                            price: newPrice.toFixed(2),
                            change: (parseFloat(item.change) + priceChange).toFixed(2),
                        };
                    }
                    
                    // NORMAL CASE: IMMEDIATE Interest rate effect on stocks
                    // Markets react instantly to rate changes (unlike bank capital which is gradual)
                    const rateEffect = interestRate >= 7 ? -0.8 :    // Very high rates: strong immediate negative
                                      interestRate > 5 ? -0.3 :     // Above uncertainty: immediate mild negative  
                                      interestRate <= 2 ? 0.9 :     // Very low rates: strong immediate positive
                                      interestRate < 4 ? 0.4 : 0;   // Below uncertainty: immediate mild positive
                    
                    // Economic cycle effect (also immediate for markets)
                    const cycleEffect = economicCycle === 'growth' ? 0.5 :
                                       economicCycle === 'recession' ? -0.6 :
                                       economicCycle === 'crisis' ? -0.9 : 0;
                    
                    // Active event effect (immediate market reaction)
                    const eventEffect = activeEvent ? 
                        (activeEvent.includes('Rally') || activeEvent.includes('Boom') ? 1.0 :
                         activeEvent.includes('Crisis') || activeEvent.includes('War') ? -1.1 : 
                         activeEvent.includes('Inflation') ? -0.5 : 0) : 0;
                    
                    // Combine all effects - IMMEDIATE full impact for ticker
                    const totalEffect = rateEffect + cycleEffect + eventEffect;
                    
                    // Calculate IMMEDIATE price change (full effect applied instantly)
                    const changeDirection = Math.random() - 0.5 + (totalEffect * 1.0); // 100% immediate effect
                    const volatility = baseVolatility * (1 + Math.abs(totalEffect * 2.0)); // Higher volatility for immediate reactions
                    
                    const priceChange = changeDirection * (Math.random() * volatility);
                    const newPrice = Math.max(0.01, price + priceChange);
                    
                    return {
                        ...item,
                        price: newPrice.toFixed(2),
                        change: (parseFloat(item.change) + priceChange).toFixed(2),
                    };
                })
            );
        }, 500); // Faster updates (every 0.5 seconds) for immediate market reactions
        
        return () => clearInterval(interval);
    }, [interestRate, economicCycle, activeEvent]); // Immediate dependency on rate changes
    const capitalPercentage = (capital / maxCapital) * 100;
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };
    
    const getEconomicCycleColor = () => {
        switch(economicCycle) {
            case 'growth': return 'text-green-400';
            case 'recession': return 'text-yellow-400';
            case 'crisis': return 'text-red-400';
            default: return 'text-green-400';
        }
    };    return (
        <header 
            className="relative z-50 bg-black p-3 rounded-none shadow-2xl border-2 border-green-500 bg-opacity-100 shadow-green-500/20 mb-4"
            style={{
                backgroundImage: `url(${capitolImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'overlay'
            }}
        >
            {/* Overlay to maintain readability */}
            <div className="absolute inset-0 bg-black bg-opacity-70 rounded-none"></div>
            
            {/* Content wrapper with relative positioning */}
            <div className="relative z-10">            {/* First Row - Game Info and Controls */}
            <div className="flex justify-between items-center mb-2 px-2">
                <h1 className="text-2xl font-display text-green-400 font-bold tracking-wider">BROKEN BONDS</h1>                 <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">DAY</p>
                            <p className="font-bold text-green-400 font-mono text-lg">{day}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">CASE</p>
                            <p className="font-bold text-green-400 font-mono text-lg">{casesToday + 1}/{casesPerDay}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">ECONOMY</p>
                            <p className={`font-bold font-mono text-lg uppercase ${getEconomicCycleColor()}`}>{economicCycle}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-green-300 text-xs uppercase tracking-wide">INTEREST RATE</p>
                            <p className="font-bold text-green-400 font-mono text-lg">{interestRate.toFixed(1)}%</p>
                        </div>
                    </div>
                      {/* Interest Rate Controls */}
                    {onAdjustInterestRate ? (
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => onAdjustInterestRate(-0.25)}
                                className="px-2 py-1 bg-red-700 hover:bg-red-600 text-red-100 font-mono text-xs border border-red-500 rounded-none transition-colors"
                                title="Decrease interest rate by 0.25%"
                            >
                                RATE -
                            </button>
                            <button 
                                onClick={() => onAdjustInterestRate(0.25)}
                                className="px-2 py-1 bg-green-700 hover:bg-green-600 text-green-100 font-mono text-xs border border-green-500 rounded-none transition-colors"
                                title="Increase interest rate by 0.25%"
                            >
                                RATE +
                            </button>
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-gray-700 text-gray-400 font-mono text-xs border border-gray-500 rounded-none">
                            RATE LOCKED
                        </div>
                    )}
                    
                    <ThemeToggle onClick={toggleTheme} theme={theme} />
                 </div>
            </div>              {/* Second Row - Prominent Capital Display */}
            <div className="text-center mb-4">
                <p className={`text-xs uppercase tracking-wide mb-1 font-bold ${isLeaking ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                    STATE CAPITAL
                </p>                <p className={`text-6xl font-bold font-mono ${isLeaking ? 'text-red-400 animate-pulse shadow-red-500/50' : 'text-green-400 shadow-green-500/50'} drop-shadow-lg`}>
                    {formatCurrency(capital)}
                </p>                {/* Economic Event Display */}
                {activeEvent && eventTimeRemaining > 0 ? (
                    <div className="mt-2 p-2 bg-red-900/30 border border-red-500 rounded-none animate-pulse">
                        <p className="text-red-300 text-sm font-mono font-bold uppercase">🚨 ACTIVE EVENT: {activeEvent}</p>
                        <p className="text-yellow-300 text-xs font-mono mt-1">
                            TIME REMAINING: {Math.floor(eventTimeRemaining / 60)}:{(eventTimeRemaining % 60).toString().padStart(2, '0')}
                        </p>
                    </div>
                ) : lastEconomicEvent ? (
                    <div className="mt-2 p-2 bg-black/50 border border-green-600 rounded-none">
                        <p className="text-green-300 text-xs font-mono">{lastEconomicEvent}</p>
                    </div>
                ) : null}
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
                    }                `}</style>
            </div>
            </div> {/* Close content wrapper */}
        </header>
    );
};

export default MarketTicker;
