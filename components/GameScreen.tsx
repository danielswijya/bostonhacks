import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scenario, ChatMessage, SystemAlert, ResolvedCase, ClientData } from '../types';
import { generateScenario, generateChatResponse } from '../services/gameService';
import { playSound } from '../services/soundService';
import { FULL_CLIENT_ROSTER } from '../constants';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import PhoneCallModal from './PhoneCallModal';
import OnboardingModal from './OnboardingModal';
import EndOfDayModal from './EndOfDayModal';
import MarketTicker from './MarketTicker';
import SystemAlerts from './SystemAlerts';


interface DayStats {
  correct: number;
  incorrect: number;
  capitalLost: number;
}

const CASES_PER_DAY = 5;
const MAX_BANK_CAPITAL = 150000000; // $150 Million
const CAPITAL_LEAK_RATE = 50000; // $50k per second
const CLIENT_DB_INITIAL_SIZE = 20;
const CLIENT_DB_GROWTH_PER_DAY = 15;

// Economic system constants
const BASE_INTEREST_RATE = 5.0; // 5% base rate
const MIN_INTEREST_RATE = 0.1;
const MAX_INTEREST_RATE = 15.0;
const ECONOMIC_CYCLE_INTERVAL = 8000; // 8 seconds
const RANDOM_EVENT_INTERVAL = 30000; // 30 seconds

const GameScreen: React.FC<{ toggleTheme: () => void; theme: 'light' | 'dark' }> = ({ toggleTheme, theme }) => {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
    // New financial state
  const [bankCapital, setBankCapital] = useState<number>(MAX_BANK_CAPITAL);
  const [capitalHistory, setCapitalHistory] = useState<number[]>([MAX_BANK_CAPITAL]);
  const [isLeaking, setIsLeaking] = useState<boolean>(false);
  const leakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Economic system state
  const [interestRate, setInterestRate] = useState<number>(BASE_INTEREST_RATE);
  const [economicCycle, setEconomicCycle] = useState<'growth' | 'recession' | 'crisis'>('growth');
  const [lastEconomicEvent, setLastEconomicEvent] = useState<string>('');
  const economicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isCustomerTyping, setIsCustomerTyping] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);

  // Game loop state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [casesToday, setCasesToday] = useState<number>(0);
  const [dayStats, setDayStats] = useState<DayStats>({ correct: 0, incorrect: 0, capitalLost: 0 });
  const [showEndOfDay, setShowEndOfDay] = useState<boolean>(false);
  const [resolvedCases, setResolvedCases] = useState<ResolvedCase[]>([]);
  const [visibleClients, setVisibleClients] = useState<ClientData[]>([]);

  // IT Dispatch Cooldown
  const [itDispatchCooldown, setItDispatchCooldown] = useState<number>(0);

  // System Alerts
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const alertIdCounter = useRef(0);

  const addAlert = (message: string, type: SystemAlert['type']) => {
    const id = alertIdCounter.current++;
    setAlerts(prev => [...prev, { id, message, type }]);
  };
  const updateVisibleClients = (day: number) => {
    // Show all clients from the start
    setVisibleClients(FULL_CLIENT_ROSTER);
  }
  useEffect(() => {
    // Set initial client database size
    updateVisibleClients(1);
  }, []);

  // Economic system effects
  useEffect(() => {
    // Start economic cycle simulation
    economicIntervalRef.current = setInterval(() => {
      // Calculate money influx/outflux based on interest rate and economic conditions
      setBankCapital(prevCapital => {
        const baseInflux = 2000000; // $2M base influx
        
        // Interest rate effect: Higher rates = more deposits but slower economy
        const rateMultiplier = interestRate > 7 ? 
          (1.5 - (interestRate - 7) * 0.1) : // Diminishing returns above 7%
          (0.8 + interestRate * 0.1); // Linear growth below 7%
        
        // Economic cycle multiplier
        const cycleMultiplier = economicCycle === 'growth' ? 1.2 : 
                               economicCycle === 'recession' ? 0.8 : 0.5; // crisis
        
        // Calculate net change
        const netChange = baseInflux * rateMultiplier * cycleMultiplier;
        
        // Random market volatility
        const volatility = (Math.random() - 0.5) * 500000; // ±$250k
        
        return Math.max(0, prevCapital + netChange + volatility);
      });
    }, ECONOMIC_CYCLE_INTERVAL);

    // Random economic events
    eventIntervalRef.current = setInterval(() => {
      const events = [
        { 
          name: 'Market Rally', 
          impact: () => Math.random() * 5000000 + 2000000, // +$2-7M
          cycle: 'growth',
          message: 'Global markets surge! Investor confidence soars.' 
        },
        { 
          name: 'Trade War Escalation', 
          impact: () => -(Math.random() * 8000000 + 3000000), // -$3-11M
          cycle: 'recession',
          message: 'International trade tensions impact global markets.' 
        },
        { 
          name: 'Central Bank Policy', 
          impact: () => (Math.random() - 0.5) * 6000000, // ±$3M
          cycle: null,
          message: 'Central bank announces new monetary policy.' 
        },
        { 
          name: 'Banking Crisis', 
          impact: () => -(Math.random() * 15000000 + 10000000), // -$10-25M
          cycle: 'crisis',
          message: 'CRISIS: Major bank collapse triggers systemic risk!' 
        },
        { 
          name: 'Tech Boom', 
          impact: () => Math.random() * 12000000 + 5000000, // +$5-17M
          cycle: 'growth',
          message: 'Technology sector breakthrough drives investment.' 
        },
        { 
          name: 'Geopolitical Tension', 
          impact: () => -(Math.random() * 6000000 + 2000000), // -$2-8M
          cycle: 'recession',
          message: 'International tensions create market uncertainty.' 
        }
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      const impact = event.impact();
      
      setBankCapital(prev => Math.max(0, prev + impact));
      setLastEconomicEvent(event.message);
      
      if (event.cycle) {
        setEconomicCycle(event.cycle);
      }
      
      // Add alert for significant events
      if (Math.abs(impact) > 5000000) {
        addAlert(event.message, impact > 0 ? 'success' : 'error');
      } else {
        addAlert(event.message, 'info');
      }
      
    }, RANDOM_EVENT_INTERVAL);

    return () => {
      if (economicIntervalRef.current) clearInterval(economicIntervalRef.current);
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    };
  }, [interestRate, economicCycle]);

  // Interest rate adjustment functions
  const adjustInterestRate = (change: number) => {
    setInterestRate(prev => {
      const newRate = Math.max(MIN_INTEREST_RATE, Math.min(MAX_INTEREST_RATE, prev + change));
      addAlert(
        `Interest rate ${change > 0 ? 'increased' : 'decreased'} to ${newRate.toFixed(1)}%`,
        'info'
      );
      return newRate;
    });
  };


  useEffect(() => {
    if (isLeaking) {
      leakIntervalRef.current = setInterval(() => {
        setBankCapital(prevCapital => {
          const newCapital = prevCapital - CAPITAL_LEAK_RATE;
          if (newCapital <= 0) {
            if (leakIntervalRef.current) clearInterval(leakIntervalRef.current);
            setIsLeaking(false);
            return 0;
          }
          return newCapital;
        });
        setDayStats(prev => ({...prev, capitalLost: prev.capitalLost + CAPITAL_LEAK_RATE}))
      }, 1000);
    } else {
      if (leakIntervalRef.current) {
        clearInterval(leakIntervalRef.current);
      }
    }
    return () => {
      if (leakIntervalRef.current) clearInterval(leakIntervalRef.current);
    };
  }, [isLeaking]);

  useEffect(() => {
    setCapitalHistory(prev => {
        const newHistory = [...prev, bankCapital];
        if (newHistory.length > 50) {
            return newHistory.slice(newHistory.length - 50);
        }
        return newHistory;
    });
  }, [bankCapital]);


  const fetchNextScenario = useCallback(async () => {
    setIsLoading(true);
    setCurrentScenario(null); 
    setChatHistory([]);
    const scenario = await generateScenario();
    setCurrentScenario(scenario);
    if (scenario) {
      setChatHistory([{ sender: 'customer', text: scenario.initialMessage }]);
    }
    setIsLoading(false);
  }, []);

  const handleNextCase = useCallback(() => {
    if (casesToday + 1 >= CASES_PER_DAY) {
      playSound('endOfDay');
      setShowEndOfDay(true);
    } else {
      setCasesToday(prev => prev + 1);
      fetchNextScenario();
    }
  }, [casesToday, fetchNextScenario]);

  const handleStartNextDay = () => {
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);
    updateVisibleClients(nextDay);
    setCasesToday(0);
    setDayStats({ correct: 0, incorrect: 0, capitalLost: 0 });
    setResolvedCases([]);
    setShowEndOfDay(false);
    fetchNextScenario();
  };

  useEffect(() => {
    if (!showOnboarding) {
        fetchNextScenario();
    }
  }, [showOnboarding, fetchNextScenario]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentScenario) return;

    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newHistory);
    setIsCustomerTyping(true);

    const geminiHistory = newHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const responseText = await generateChatResponse(geminiHistory, currentScenario.personality, currentScenario.isScam);
    
    playSound('newMessage');
    setChatHistory(prev => [...prev, { sender: 'customer', text: responseText }]);
    setIsCustomerTyping(false);
  };

  const handleDecision = (approved: boolean) => {
    if (!currentScenario) return;

    const correctDecision = (approved && !currentScenario.isScam) || (!approved && currentScenario.isScam);

    setResolvedCases(prev => [...prev, {
        scenario: currentScenario,
        playerDecision: approved ? 'approved' : 'denied',
        isCorrect: correctDecision
    }]);

    if (correctDecision) {
      setDayStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setDayStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      if(currentScenario.isScam){
        setIsLeaking(true);
        addAlert("Anomalous capital outflow detected! Breach protocol initiated.", 'error');
      } else {
        // Penalty for denying a valid customer
        const penalty = 500000; // $500k penalty
        setBankCapital(prev => Math.max(0, prev - penalty));
        setDayStats(prev => ({...prev, capitalLost: prev.capitalLost + penalty}));
        addAlert("Legitimate transaction denied. Client confidence impacted.", 'info');
      }
    }
    
    handleNextCase();
  };

  const handleDispatchIT = () => {
    if (isLeaking) {
      setIsLeaking(false);
      setItDispatchCooldown(casesToday + 2); // Cooldown for 2 cases
      addAlert("IT Security dispatched. Leak quarantined.", 'success');
      playSound('approve');
    }
  };
    const resetGame = () => {
    setBankCapital(MAX_BANK_CAPITAL);
    setCapitalHistory([MAX_BANK_CAPITAL]);
    setIsLeaking(false);
    setResolvedCases([]);
    updateVisibleClients(1);
    setCurrentDay(1);
    setCasesToday(0);
    setDayStats({ correct: 0, incorrect: 0, capitalLost: 0 });
    setShowEndOfDay(false);
    setShowOnboarding(true); 
    setItDispatchCooldown(0);
    setAlerts([]);
    
    // Reset economic state
    setInterestRate(BASE_INTEREST_RATE);
    setEconomicCycle('growth');
    setLastEconomicEvent('');
    
    fetchNextScenario();
  };

  if (showOnboarding) {
    return <OnboardingModal onClose={() => setShowOnboarding(false)} />;
  }
  if (bankCapital <= 0) {
    return (
        <div className="text-center p-8 bg-black rounded-none shadow-[0_0_50px_rgba(239,68,68,0.8)] animate-fade-in border-2 border-red-500">
            <h2 className="text-6xl font-mono text-red-400 mb-4 tracking-wider animate-pulse">BANK CAPITAL DEPLETED</h2>
            <p className="text-xl mb-6 text-green-400 font-mono">A catastrophic capital breach has led to total asset loss and market collapse. Your position has been terminated.</p>
            <p className="mb-4 text-green-600 font-mono">Total Days Survived: {currentDay - 1}</p>
            <button
                onClick={resetGame}
                className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-3 px-6 rounded-none transition-all duration-300 font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            >
                ---ENTER INTO A SECURE LINE---
            </button>
        </div>
    );
  }

  if (showEndOfDay) {
    return <EndOfDayModal day={currentDay} stats={dayStats} onNextDay={handleStartNextDay} resolvedCases={resolvedCases} />;
  }  return (
    <>
      <MarketTicker 
        capital={bankCapital}
        maxCapital={MAX_BANK_CAPITAL}
        history={capitalHistory} 
        toggleTheme={toggleTheme} 
        theme={theme}
        isLeaking={isLeaking}
        day={currentDay}
        casesToday={casesToday}
        casesPerDay={CASES_PER_DAY}
        interestRate={interestRate}
        economicCycle={economicCycle}
        lastEconomicEvent={lastEconomicEvent}
        onAdjustInterestRate={adjustInterestRate}
      />
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 transition-shadow duration-500 rounded-none ${isLeaking ? 'shadow-[0_0_50px_rgba(239,68,68,0.8)]' : ''}`}>
        <div id="left-panel-onboarding" className="lg:col-span-1">
          <LeftPanel 
            scenario={currentScenario} 
            isLoading={isLoading}
            chatHistory={chatHistory}
            isCustomerTyping={isCustomerTyping}
            onSendMessage={handleSendMessage}
            onStartCall={() => setIsCallActive(true)}
            decisionMade={isLoading}
          />
        </div>        <div id="right-panel-onboarding" className="lg:col-span-1">
          <RightPanel 
              onDecision={handleDecision}
              isLoading={isLoading}
              clients={visibleClients}
              isLeaking={isLeaking}
              casesToday={casesToday}
              onDispatchIT={handleDispatchIT}
              itDispatchCooldownCases={itDispatchCooldown}
          />
        </div>
      </div>
      {isCallActive && currentScenario && (
        <PhoneCallModal
          scenario={currentScenario}
          onClose={() => setIsCallActive(false)}
        />
      )}
      <SystemAlerts alerts={alerts} onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} />
    </>
  );
};

export default GameScreen;