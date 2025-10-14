import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scenario, ChatMessage, ResolvedCase, ClientData } from '../types';
import { generateScenario, generateChatResponse } from '../services/gameService';
import { playSound, playBackgroundMusic, pauseBackgroundMusic, resumeBackgroundMusic } from '../services/soundService';
import { FULL_CLIENT_ROSTER } from '../constants';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import PhoneCallModal from './PhoneCallModal';
import OnboardingModal from './OnboardingModal';
import EndOfDayModal from './EndOfDayModal';
import MarketTicker from './MarketTicker';
import AlertDialog from './AlertDialog';
import NewsletterDialog from './NewsletterDialog';
import InterestRateDialog from './InterestRateDialog';

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
const BASE_INTEREST_RATE = 4.5; // ✓ Correct (middle of 2-7%)
const MIN_INTEREST_RATE = 2.0;  // ✓ Correct
const MAX_INTEREST_RATE = 7.0;  // ✓ Correct
const ECONOMIC_CYCLE_INTERVAL = 5000; // 5 seconds (faster cycles for more volatility)
const RANDOM_EVENT_INTERVAL = 120000; // 2 minutes between events
const EVENT_DURATION = 30000; // 30 seconds duration

// Phone verification utility
const verifyPhoneNumber = (customerName: string, phoneNumber: string): boolean => {
  const client = FULL_CLIENT_ROSTER.find(client => 
    client.name.toLowerCase() === customerName.toLowerCase()
  );
  return client ? client.phoneNumber === phoneNumber : false;
};

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
  const [isInterestRateLocked, setIsInterestRateLocked] = useState<boolean>(false);
  const [showInterestRateDialog, setShowInterestRateDialog] = useState<boolean>(false);
  const [economicCycle, setEconomicCycle] = useState<'growth' | 'recession' | 'crisis'>('growth');
  const [lastEconomicEvent, setLastEconomicEvent] = useState<string>('');
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [eventTimeRemaining, setEventTimeRemaining] = useState<number>(0);
  const economicIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isCustomerTyping, setIsCustomerTyping] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null); // null = not checked, true/false = result

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
  // Add state to track daily performance for the final report
  const [dailyReports, setDailyReports] = useState<Array<{
    day: number;
    stats: DayStats;
    cases: ResolvedCase[];
    finalCapital: number;
    economicEvents: string[];
  }>>([]);
  // Add new state for dialogs and alerts
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'critical' | 'success'>('info');
  const [showNewsletter, setShowNewsletter] = useState<boolean>(false);
  const [newsletterContent, setNewsletterContent] = useState<string>('');
  const [economicsUpdatesPaused, setEconomicsUpdatesPaused] = useState<boolean>(false);
  // Add new state for geopolitical alert cooldowns
  const [geopoliticalCooldowns, setGeopoliticalCooldowns] = useState<{
    critical: number;
    warning: number;
    success: number;
    info: number;
  }>({
    critical: 0,
    warning: 0,
    success: 0,
    info: 0
  });
  const updateVisibleClients = (day: number) => {
    // Show all clients from the start
    setVisibleClients(FULL_CLIENT_ROSTER);
  }
  useEffect(() => {
    // Set initial client database size
    updateVisibleClients(1);
  }, []);  // Economic system effects
  useEffect(() => {
    if (economicsUpdatesPaused || showOnboarding) {
      // Clear event timer when economics are paused or during onboarding
      if (eventTimerRef.current) {
        clearInterval(eventTimerRef.current);
        eventTimerRef.current = null;
      }
      return; // Don't update if paused or during onboarding
    }
  
    economicIntervalRef.current = setInterval(() => {
      setBankCapital(prevCapital => {
        // Base flows
        const baseDepositFlow = 3000000; // $3M base deposits
        const baseLendingRevenue = 2000000; // $2M base lending income
        const baseOperatingCosts = 1000000; // $1M base operating costs
        
        const rateSpread = interestRate - BASE_INTEREST_RATE; // Deviation from 4.5%
        
        // GRADUAL DEPOSIT FLOW - Bank capital responds slowly to rate changes
        // Higher rates gradually attract more deposits over time
        const depositMultiplier = 1 + (rateSpread * 0.20); // Increased for more noticeable gradual effect
        const depositFlow = Math.max(0, baseDepositFlow * depositMultiplier);
        
        // GRADUAL LENDING REVENUE - Bank lending adjusts slowly to rate changes
        // Lower rates gradually increase lending demand over time
        const lendingMultiplier = 1 - (rateSpread * 0.12); // Adjusted for balanced gradual effect
        const lendingRevenue = Math.max(0, baseLendingRevenue * lendingMultiplier);
        
        // INTEREST EXPENSE - This is immediate as it's contractual
        const annualizedRate = ECONOMIC_CYCLE_INTERVAL / (1000 * 60 * 60 * 24 * 365); // Convert to annual fraction
        const interestExpense = depositFlow * (interestRate / 100) * annualizedRate;
        
        // NET INTEREST INCOME (Revenue - Expense)
        const netInterestIncome = lendingRevenue - interestExpense;
        
        // Economic cycle effects on bank operations (gradual)
        const cycleMultipliers = {
          growth: { deposits: 1.12, lending: 1.18, costs: 1.0 },    // Slightly increased for visibility
          recession: { deposits: 0.88, lending: 0.82, costs: 1.08 }, // More pronounced gradual effects
          crisis: { deposits: 0.75, lending: 0.65, costs: 1.20 }     // Stronger crisis impact
        };
        
        const cycle = cycleMultipliers[economicCycle];
        
        // Apply cycle effects gradually
        const finalDepositFlow = depositFlow * cycle.deposits;
        const finalNetIncome = netInterestIncome * cycle.lending;
        const operatingCosts = baseOperatingCosts * cycle.costs;
        
        // Controlled market volatility for gradual changes
        const volatilityRange = 800000; // ±$800k (reduced for smoother gradual changes)
        const marketVolatility = (Math.random() - 0.5) * volatilityRange;
        
        // FINAL CALCULATION: Gradual capital changes
        const netCapitalChange = finalDepositFlow + finalNetIncome - operatingCosts + marketVolatility;
        
        const newCapital = Math.max(0, prevCapital + netCapitalChange);
        
        // REDUCED frequency: Check for geopolitical events less often to prevent spam
        if (Math.random() < 0.03) { // Reduced from 0.1 (10%) to 0.03 (3%) chance per cycle
          setTimeout(() => checkGeopoliticalEvents(newCapital), 1000);
        }
        
        // Update capital history for the graph
        setCapitalHistory(prevHistory => {
          const newHistory = [...prevHistory, newCapital];
          return newHistory.slice(-50); // Keep last 50 data points
        });
        
        return newCapital;
      });
    }, ECONOMIC_CYCLE_INTERVAL); // Every 5 seconds for gradual changes
    
    // Keep the economic events system as is (these provide occasional shocks)
    eventIntervalRef.current = setInterval(() => {
      const events = [
        { 
          name: 'Market Rally', 
          impact: () => {
            // Smaller rally impacts for gradual system
            const baseImpact = Math.random() * 5000000 + 2500000; // $2.5-7.5M (reduced)
            const cycleBonus = economicCycle === 'growth' ? 1.3 : 
                              economicCycle === 'recession' ? 0.8 : 0.5;
            const rateBonus = interestRate < 3.5 ? 1.2 : 1.0; // Low rates boost markets
            return baseImpact * cycleBonus * rateBonus;
          },
          cycle: 'growth',
          message: 'Global markets surge! Investor confidence soars.' 
        },
        { 
          name: 'Trade War Escalation', 
          impact: () => {
            const baseImpact = -(Math.random() * 8000000 + 4000000); // -$4-12M (reduced)
            const cyclePenalty = economicCycle === 'crisis' ? 1.5 : 
                                economicCycle === 'recession' ? 1.2 : 1.0;
            return baseImpact * cyclePenalty;
          },
          cycle: 'recession',
          message: 'International trade tensions impact global markets.' 
        },
        { 
          name: 'Federal Reserve Policy', 
          impact: () => {
            // Fed policy impact for 2-7% range
            const rateDeviation = Math.abs(interestRate - BASE_INTEREST_RATE);
            const baseImpact = (Math.random() - 0.5) * 6000000; // ±$3M (reduced)
            const rateMultiplier = 1 + (rateDeviation * 0.2); // Smaller multiplier
            return baseImpact * rateMultiplier;
          },
          cycle: null,
          message: 'Federal Reserve announces monetary policy changes.' 
        },
        { 
          name: 'Banking Crisis', 
          impact: () => {
            const baseImpact = -(Math.random() * 15000000 + 8000000); // -$8-23M (reduced)
            const rateEffect = interestRate > 6 ? 1.3 : 1.0; // High rates within range
            const cycleEffect = economicCycle === 'crisis' ? 1.5 : 1.0;
            return baseImpact * rateEffect * cycleEffect;
          },
          cycle: 'crisis',
          message: 'CRISIS: Major financial institution collapse!' 
        },
        { 
          name: 'Tech Innovation Boom', 
          impact: () => {
            const baseImpact = Math.random() * 10000000 + 5000000; // $5-15M (reduced)
            const rateBonus = interestRate < 4 ? 1.3 : 0.9; // Low rates favor growth
            const cycleBonus = economicCycle === 'growth' ? 1.2 : 
                              economicCycle === 'recession' ? 0.8 : 0.6;
            return baseImpact * rateBonus * cycleBonus;
          },
          cycle: 'growth',
          message: 'Breakthrough technology drives massive investment flows.' 
        },
        { 
          name: 'Geopolitical Tension', 
          impact: () => {
            const baseImpact = -(Math.random() * 6000000 + 3000000); // -$3-9M (reduced)
            const flightToSafety = interestRate > 5.5 ? 0.8 : 1.0; // High rates provide safe haven
            const cycleEffect = economicCycle === 'crisis' ? 1.4 : 1.0;
            return baseImpact * flightToSafety * cycleEffect;
          },
          cycle: 'recession',
          message: 'International tensions create market uncertainty.' 
        },
        { 
          name: 'Inflation Shock', 
          impact: () => {
            // Inflation impact for 2-7% range
            const baseImpact = -(Math.random() * 9000000 + 4000000); // -$4-13M (reduced)
            const rateResponse = interestRate < 3 ? 1.4 : // Low rates can't fight inflation
                                interestRate > 6 ? 0.7 : 1.0; // High rates combat inflation
            return baseImpact * rateResponse;
          },
          cycle: 'recession',
          message: 'Unexpected inflation surge disrupts financial markets.' 
        },
        { 
          name: 'Credit Expansion', 
          impact: () => {
            // Credit flows for 2-7% range
            const baseImpact = Math.random() * 4000000 + 2000000; // $2-6M (reduced)
            const rateEffect = interestRate < 3.5 ? 1.5 : // Low rates boost credit
                              interestRate > 5.5 ? 0.5 : 1.0; // High rates restrict credit
            const cycleEffect = economicCycle === 'growth' ? 1.1 : 
                               economicCycle === 'crisis' ? 0.3 : 0.9;
            return baseImpact * rateEffect * cycleEffect;
          },
          cycle: null,
          message: 'Credit markets show increased lending activity.' 
        }
      ];      const event = events[Math.floor(Math.random() * events.length)];
      const impact = event.impact();
      
      // Clear any existing event timer before starting a new one
      if (eventTimerRef.current) {
        clearInterval(eventTimerRef.current);
      }
      
      // Apply immediate impact
      setBankCapital(prev => Math.max(0, prev + impact));
      setLastEconomicEvent(event.message);
      setActiveEvent(event.name);
      setEventTimeRemaining(EVENT_DURATION / 1000); // Convert to seconds for display
      
      if (event.cycle) {
        setEconomicCycle(event.cycle);
      }
      
      // Start countdown timer for the event
      eventTimerRef.current = setInterval(() => {
        setEventTimeRemaining(prev => {
          if (prev <= 1) {
            setActiveEvent(null);
            if (eventTimerRef.current) {
              clearInterval(eventTimerRef.current);
              eventTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    }, RANDOM_EVENT_INTERVAL);    return () => {
      if (economicIntervalRef.current) clearInterval(economicIntervalRef.current);
      if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
      if (eventTimerRef.current) clearInterval(eventTimerRef.current);
    };
  }, [interestRate, economicCycle, economicsUpdatesPaused, geopoliticalCooldowns, showOnboarding]);  // Interest rate adjustment functions
  const adjustInterestRate = (change: number) => {
    if (!isInterestRateLocked) {
      setInterestRate(prev => {
        const newRate = Math.max(MIN_INTEREST_RATE, Math.min(MAX_INTEREST_RATE, prev + change));
        return newRate;
      });
    }
  };

  const handleSetInterestRate = (rate: number) => {
    setInterestRate(rate);
    setIsInterestRateLocked(true);
    setShowInterestRateDialog(false);
    
    // Start background music after setting interest rate (after onboarding)
    if (!showOnboarding) {
      playBackgroundMusic();
    }
  };

  // Add a separate effect that triggers immediate market reaction to interest rate changes

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
  }, [isLeaking]);  useEffect(() => {
    setCapitalHistory(prev => {
        const newHistory = [...prev, bankCapital];
        if (newHistory.length > 50) {
            return newHistory.slice(newHistory.length - 50);
        }
        return newHistory;
    });
  }, [bankCapital]);
  // Handle event timer when economics resume  
  useEffect(() => {
    // If economics just resumed and there's an active event with time remaining, restart the countdown
    if (!economicsUpdatesPaused && !showOnboarding && activeEvent && eventTimeRemaining > 0 && !eventTimerRef.current) {
      // Start the countdown timer
      eventTimerRef.current = setInterval(() => {
        setEventTimeRemaining(prev => {
          if (prev <= 1) {
            setActiveEvent(null);
            if (eventTimerRef.current) {
              clearInterval(eventTimerRef.current);
              eventTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
      return () => {
      if (eventTimerRef.current && (economicsUpdatesPaused || showOnboarding)) {
        clearInterval(eventTimerRef.current);
        eventTimerRef.current = null;
      }
    };
  }, [economicsUpdatesPaused, activeEvent, eventTimeRemaining, showOnboarding]);

  const fetchNextScenario = useCallback(async () => {
    setIsLoading(true);
    setCurrentScenario(null); 
    setChatHistory([]);
    setPhoneVerified(null); // Reset phone verification
    const scenario = await generateScenario();
    setCurrentScenario(scenario);
    if (scenario) {
      setChatHistory([{ sender: 'customer', text: scenario.initialMessage }]);
    }
    setIsLoading(false);
  }, []);

  const handleNextCase = useCallback(() => {
    if (casesToday + 1 >= CASES_PER_DAY) {
      setEconomicsUpdatesPaused(true); // Freeze money changes
      playSound('endOfDay');
      setShowEndOfDay(true);
    } else {
      setCasesToday(prev => prev + 1);
      fetchNextScenario();
    }
  }, [casesToday, fetchNextScenario]);
  // Update the handleStartNextDay function to save daily reports
  const handleStartNextDay = () => {
    // Save the current day's report before moving to next day
    const dayReport = {
      day: currentDay,
      stats: dayStats,
      cases: resolvedCases,
      finalCapital: bankCapital,
      economicEvents: [lastEconomicEvent].filter(Boolean)
    };
    
    setDailyReports(prev => [...prev, dayReport]);
    
    // Generate and show newsletter
    const newsletter = generateNewsletterContent(
      currentDay, 
      dayStats, 
      bankCapital, 
      [lastEconomicEvent].filter(Boolean)
    );
    setNewsletterContent(newsletter);
    setShowNewsletter(true);
  
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);
    updateVisibleClients(nextDay);
    setCasesToday(0);
    setDayStats({ correct: 0, incorrect: 0, capitalLost: 0 });
    setResolvedCases([]);
    setShowEndOfDay(false);
    setEconomicsUpdatesPaused(false); // Resume money changes
    
    // Reset interest rate lock for new day
    setIsInterestRateLocked(false);
    setShowInterestRateDialog(true); // Show interest rate dialog for new day
    
    fetchNextScenario();
  };
  useEffect(() => {
    if (!showOnboarding && !isInterestRateLocked) {
      setShowInterestRateDialog(true);
    } else if (!showOnboarding && isInterestRateLocked) {
      fetchNextScenario();
      // Start background music after onboarding is complete and rate is set
      playBackgroundMusic();
    }
  }, [showOnboarding, isInterestRateLocked, fetchNextScenario]);
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentScenario) return;

    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newHistory);
    setIsCustomerTyping(true);

    // Use the correct generateChatResponse function from gameService
    const responseText = await generateChatResponse(message, currentScenario, newHistory);
    
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
      
      if (currentScenario.isScam && approved) {
        // SECURITY BREACH: Player approved a scam - immediate capital loss
        const breachPenalty = Math.random() * 20000000 + 30000000; // $30-50M random loss
        setBankCapital(prev => Math.max(0, prev - breachPenalty));
        setDayStats(prev => ({...prev, capitalLost: prev.capitalLost + breachPenalty}));
        
        // Start the ongoing leak
        setIsLeaking(true);
      } else if (!currentScenario.isScam && !approved) {
        // Penalty for denying a valid customer (smaller penalty)
        const penalty = 2000000; // $2M penalty
        setBankCapital(prev => Math.max(0, prev - penalty));
        setDayStats(prev => ({...prev, capitalLost: prev.capitalLost + penalty}));
      }
      // Note: If player denies a scam (!approved && isScam), that's correct - no penalty
    }
    
    // Always proceed to next case - don't block the game flow
    handleNextCase();
  };
  

  const handleDispatchIT = () => {
    if (isLeaking) {
      setIsLeaking(false);
      setItDispatchCooldown(casesToday + 2); // Cooldown for 2 cases
      playSound('approve');
    }
  };
  const handleStartCall = () => {
    setIsCallActive(true);
    pauseBackgroundMusic(); // Pause background music during calls
  };

  const handlePhoneCallComplete = () => {
    if (currentScenario) {
      const isValid = verifyPhoneNumber(currentScenario.customerName, currentScenario.phoneNumber);
      setPhoneVerified(isValid);
      playSound(isValid ? 'approve' : 'deny');
    }
    setIsCallActive(false);
    resumeBackgroundMusic(); // Resume background music after calls
  };
  // Update the resetGame function to reset cooldowns
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
    setDailyReports([]); // Clear daily reports for new game
    
    // Reset geopolitical cooldowns
    setGeopoliticalCooldowns({
      critical: 0,
      warning: 0,
      success: 0,
      info: 0
    });
    
    // Reset economic state
    setInterestRate(BASE_INTEREST_RATE);
    setIsInterestRateLocked(false);
    setShowInterestRateDialog(false);
    setEconomicCycle('growth');
    setLastEconomicEvent('');
    setActiveEvent(null);
    setEventTimeRemaining(0);
    
    fetchNextScenario();
  };

  // Create a comprehensive game over component
  const GameOverReport: React.FC<{
    totalDays: number;
    dailyReports: Array<{
      day: number;
      stats: DayStats;
      cases: ResolvedCase[];
      finalCapital: number;
      economicEvents: string[];
    }>;
    onRestart: () => void;
  }> = ({ totalDays, dailyReports, onRestart }) => {
    // Calculate overall statistics
    const totalCases = dailyReports.reduce((sum, day) => sum + day.stats.correct + day.stats.incorrect, 0);
    const totalCorrect = dailyReports.reduce((sum, day) => sum + day.stats.correct, 0);
    const totalIncorrect = dailyReports.reduce((sum, day) => sum + day.stats.incorrect, 0);
    const totalCapitalLost = dailyReports.reduce((sum, day) => sum + day.stats.capitalLost, 0);
    const accuracyRate = totalCases > 0 ? ((totalCorrect / totalCases) * 100).toFixed(1) : '0.0';
    
    // Find best and worst performing days
    const bestDay = dailyReports.reduce((best, current) => 
      current.stats.correct > best.stats.correct ? current : best, dailyReports[0] || { day: 0, stats: { correct: 0, incorrect: 0, capitalLost: 0 } });
    const worstDay = dailyReports.reduce((worst, current) => 
      current.stats.capitalLost > worst.stats.capitalLost ? current : worst, dailyReports[0] || { day: 0, stats: { correct: 0, incorrect: 0, capitalLost: 0 } });
  
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
        <div className="bg-black border-2 border-red-500 rounded-none p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(239,68,68,0.8)]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-mono text-red-400 mb-4 tracking-wider animate-pulse">MISSION TERMINATED</h1>
            <h2 className="text-3xl font-mono text-green-400 mb-2 border-b border-green-500 pb-2">FINAL INTELLIGENCE REPORT</h2>
            <p className="text-xl text-green-300 font-mono">CLASSIFIED - EYES ONLY</p>
          </div>
  
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-green-500 p-4 rounded-none">
              <h3 className="text-green-400 font-mono text-sm mb-2">MISSION DURATION</h3>
              <p className="text-2xl font-mono text-white">{totalDays} DAYS</p>
            </div>
            <div className="bg-gray-900 border border-green-500 p-4 rounded-none">
              <h3 className="text-green-400 font-mono text-sm mb-2">TOTAL CASES</h3>
              <p className="text-2xl font-mono text-white">{totalCases}</p>
            </div>
            <div className="bg-gray-900 border border-green-500 p-4 rounded-none">
              <h3 className="text-green-400 font-mono text-sm mb-2">ACCURACY RATE</h3>
              <p className={`text-2xl font-mono ${parseFloat(accuracyRate) >= 80 ? 'text-green-400' : parseFloat(accuracyRate) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {accuracyRate}%
              </p>
            </div>
            <div className="bg-gray-900 border border-red-500 p-4 rounded-none">
              <h3 className="text-red-400 font-mono text-sm mb-2">CAPITAL LOST</h3>
              <p className="text-2xl font-mono text-red-400">${(totalCapitalLost / 1000000).toFixed(1)}M</p>
            </div>
          </div>
  
          {/* Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 border border-green-500 p-4 rounded-none">
              <h3 className="text-green-400 font-mono text-lg mb-3">BEST PERFORMANCE</h3>
              <p className="text-green-300 font-mono">Day {bestDay.day}</p>
              <p className="text-sm text-green-400 font-mono">{bestDay.stats.correct} Correct Decisions</p>
              <p className="text-sm text-green-400 font-mono">${(bestDay.stats.capitalLost / 1000000).toFixed(1)}M Lost</p>
            </div>
            <div className="bg-gray-900 border border-red-500 p-4 rounded-none">
              <h3 className="text-red-400 font-mono text-lg mb-3">WORST PERFORMANCE</h3>
              <p className="text-red-300 font-mono">Day {worstDay.day}</p>
              <p className="text-sm text-red-400 font-mono">{worstDay.stats.incorrect} Incorrect Decisions</p>
              <p className="text-sm text-red-400 font-mono">${(worstDay.stats.capitalLost / 1000000).toFixed(1)}M Lost</p>
            </div>
          </div>
  
          {/* Daily Breakdown */}
          <div className="mb-8">
            <h3 className="text-green-400 font-mono text-xl mb-4 border-b border-green-500 pb-2">DAILY MISSION REPORTS</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {dailyReports.map((dayReport) => (
                <div key={dayReport.day} className="bg-gray-900 border border-green-500 p-4 rounded-none">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="text-green-400 font-mono font-bold">DAY {dayReport.day}</h4>
                      <p className="text-sm text-green-300 font-mono">
                        Final Capital: ${(dayReport.finalCapital / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-mono text-sm">DECISIONS</p>
                      <p className="text-green-300 font-mono text-sm">
                        ✓ {dayReport.stats.correct} | ✗ {dayReport.stats.incorrect}
                      </p>
                    </div>
                    <div>
                      <p className="text-red-400 font-mono text-sm">LOSSES</p>
                      <p className="text-red-300 font-mono text-sm">
                        ${(dayReport.stats.capitalLost / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-yellow-400 font-mono text-sm">ACCURACY</p>
                      <p className="text-yellow-300 font-mono text-sm">
                        {dayReport.stats.correct + dayReport.stats.incorrect > 0 
                          ? ((dayReport.stats.correct / (dayReport.stats.correct + dayReport.stats.incorrect)) * 100).toFixed(0)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Show major security breaches */}
                  {dayReport.cases.some(c => !c.isCorrect && c.scenario.isScam && c.playerDecision === 'approved') && (
                    <div className="mt-2 p-2 bg-red-900/30 border border-red-500 rounded-none">
                      <p className="text-red-300 font-mono text-xs">⚠️ SECURITY BREACH DETECTED</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
  
          {/* Security Assessment */}
          <div className="mb-8">
            <h3 className="text-green-400 font-mono text-xl mb-4 border-b border-green-500 pb-2">SECURITY ASSESSMENT</h3>
            <div className="bg-gray-900 border border-yellow-500 p-4 rounded-none">
              {parseFloat(accuracyRate) >= 90 && (
                <p className="text-green-400 font-mono">EXEMPLARY: Outstanding performance in threat detection and risk management.</p>
              )}
              {parseFloat(accuracyRate) >= 80 && parseFloat(accuracyRate) < 90 && (
                <p className="text-green-400 font-mono">SATISFACTORY: Good operational security with minor room for improvement.</p>
              )}
              {parseFloat(accuracyRate) >= 70 && parseFloat(accuracyRate) < 80 && (
                <p className="text-yellow-400 font-mono">ADEQUATE: Acceptable performance but requires enhanced vigilance protocols.</p>
              )}
              {parseFloat(accuracyRate) >= 60 && parseFloat(accuracyRate) < 70 && (
                <p className="text-orange-400 font-mono">CONCERNING: Multiple security lapses detected. Immediate retraining recommended.</p>
              )}
              {parseFloat(accuracyRate) < 60 && (
                <p className="text-red-400 font-mono">CRITICAL FAILURE: Severe operational deficiencies. Security clearance under review.</p>
              )}
            </div>
          </div>
  
          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <button
              onClick={onRestart}
              className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-4 px-8 rounded-none transition-all duration-300 font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] text-xl tracking-wider"
            >
              INITIATE NEW MISSION
            </button>
            <p className="text-green-600 font-mono text-sm">All mission data will be archived and new clearance issued.</p>
          </div>
        </div>
      </div>
    );
  };

  // Geopolitical events based on capital levels
  const checkGeopoliticalEvents = (capital: number) => {
    const capitalInMillions = capital / 1000000;
    const currentTime = Date.now();
    
    // Define cooldown periods (in milliseconds)
    const COOLDOWN_PERIODS = {
      critical: 30000,  // 30 seconds for critical alerts
      warning: 45000,   // 45 seconds for warnings
      success: 60000,   // 60 seconds for success messages
      info: 30000       // 30 seconds for info
    };
    
    // Critical low capital events
    if (capitalInMillions < 50 && capitalInMillions > 0) {
      // Check if critical cooldown has passed
      if (currentTime - geopoliticalCooldowns.critical > COOLDOWN_PERIODS.critical) {
        const criticalEvents = [
          "BREAKING: President announces resignation amid economic crisis. 'The banking sector collapse has shaken our nation's foundation,' says outgoing leader.",
          "EMERGENCY SESSION: Congress convenes to discuss emergency economic measures as banking sector teeters on collapse.",
          "MARKETS IN TURMOIL: International investors flee as domestic banking institution faces imminent failure.",
          "FEDERAL INTERVENTION: Treasury Secretary announces potential government bailout discussions.",
          "CRISIS DEEPENS: Rating agencies downgrade national economic outlook to 'Critical Risk'.",
        ];
        
        const event = criticalEvents[Math.floor(Math.random() * criticalEvents.length)];
        showAlertDialog(event, 'critical');
        
        // Set cooldown
        setGeopoliticalCooldowns(prev => ({ ...prev, critical: currentTime }));
      }
    }
    
    // Very low capital warnings  
    else if (capitalInMillions < 75 && capitalInMillions >= 50) {
      // Check if warning cooldown has passed
      if (currentTime - geopoliticalCooldowns.warning > COOLDOWN_PERIODS.warning) {
        const warningEvents = [
          "ECONOMIC CONCERNS: Federal Reserve Chairman expresses 'serious concerns' about banking sector stability.",
          "MARKET WATCH: Analysts warn of potential systemic banking risks as major institution shows strain.",
          "GOVERNMENT ALERT: Treasury Department monitoring situation closely, prepared to take action if needed.",
        ];
        
        const event = warningEvents[Math.floor(Math.random() * warningEvents.length)];
        showAlertDialog(event, 'warning');
        
        // Set cooldown
        setGeopoliticalCooldowns(prev => ({ ...prev, warning: currentTime }));
      }
    }
      // High capital success events
    else if (capitalInMillions > 300) {
      // Check if success cooldown has passed
      if (currentTime - geopoliticalCooldowns.success > COOLDOWN_PERIODS.success) {
        const successEvents = [
          "PRESIDENTIAL PRAISE: 'This is the strongest our banking sector has been in a decade!' declares President at economic summit.",
          "ECONOMIC BOOM: International media lauds the nation's banking resilience and economic leadership.",
          "RECORD PERFORMANCE: Treasury Secretary announces record-breaking financial sector performance metrics.",
          "GLOBAL RECOGNITION: World Bank commends exceptional banking sector management and stability.",
        ];
        
        const event = successEvents[Math.floor(Math.random() * successEvents.length)];
        showAlertDialog(event, 'success');
        
        // Set cooldown
        setGeopoliticalCooldowns(prev => ({ ...prev, success: currentTime }));
      }
    }
    
    // Medium capital range (75-180M) - no alerts, this is the "stable" zone
    // This prevents constant alerts when capital is in a normal range
  };

  // Alert dialog function
  const showAlertDialog = (message: string, type: 'info' | 'warning' | 'critical' | 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    // Auto-dismiss after 8 seconds for non-critical alerts
    if (type !== 'critical') {
      setTimeout(() => {
        setShowAlert(false);
      }, 8000);
    }
  };

  // Generate daily newsletter content
  const generateNewsletterContent = (day: number, stats: DayStats, capital: number, economicEvents: string[]) => {
    const capitalInMillions = (capital / 1000000).toFixed(1);
    const accuracy = stats.correct + stats.incorrect > 0 ? 
      ((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(0) : 0;
    
    const headlines = [
      `📊 DAILY INTELLIGENCE BRIEF - DAY ${day}`,
      `🏦 Bank Capital Status: $${capitalInMillions}M`,
      `📈 Decision Accuracy: ${accuracy}%`,
      `🔒 Security Incidents: ${stats.incorrect}`,
      `💰 Capital Lost: $${(stats.capitalLost / 1000000).toFixed(1)}M`,
      '',
      '🌍 ECONOMIC DEVELOPMENTS:',
      ...economicEvents.map(event => `• ${event}`),
      '',
      '📋 OPERATIONAL SUMMARY:',
      `• Processed ${stats.correct + stats.incorrect} cases`,
      `• Maintained ${accuracy}% accuracy rate`,
      stats.incorrect > 0 ? `• ${stats.incorrect} security breaches contained` : '• No security incidents recorded',      '',
      capital > 300000000 ? '✅ SECTOR STATUS: STABLE' : 
      capital > 150000000 ? '⚠️ SECTOR STATUS: MONITORING' : 
      capital > 50000000 ? '🚨 SECTOR STATUS: UNSTABLE' : 
      '🔥 SECTOR STATUS: CRITICAL',
    ];
    
    return headlines.join('\n');
  };
  if (showOnboarding) {
    return <OnboardingModal onClose={() => setShowOnboarding(false)} />;
  }

  if (showInterestRateDialog) {
    return (
      <InterestRateDialog
        onSetRate={handleSetInterestRate}
        minRate={MIN_INTEREST_RATE}
        maxRate={MAX_INTEREST_RATE}
        currentRate={interestRate}
      />
    );
  }
  // Update the game over condition to show the comprehensive report
  if (bankCapital <= 0) {
    // Save the final day's report if it hasn't been saved yet
    const finalDailyReports = dailyReports.some(r => r.day === currentDay) 
      ? dailyReports 
      : [...dailyReports, {
          day: currentDay,
          stats: dayStats,
          cases: resolvedCases,
          finalCapital: bankCapital,
          economicEvents: [lastEconomicEvent].filter(Boolean)
        }];
  
    return (
      <GameOverReport 
        totalDays={currentDay}
        dailyReports={finalDailyReports}
        onRestart={resetGame}
      />
    );
  }

  if (showEndOfDay) {
    return <EndOfDayModal day={currentDay} stats={dayStats} onNextDay={handleStartNextDay} resolvedCases={resolvedCases} />;
  }  return (
    <>      <MarketTicker 
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
        activeEvent={activeEvent}
        eventTimeRemaining={eventTimeRemaining}
        onAdjustInterestRate={isInterestRateLocked ? undefined : adjustInterestRate}
      />
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 transition-shadow duration-500 rounded-none ${isLeaking ? 'shadow-[0_0_50px_rgba(239,68,68,0.8)]' : ''}`}>
        <div id="left-panel-onboarding" className="lg:col-span-1">          <LeftPanel 
            scenario={currentScenario} 
            isLoading={isLoading}
            chatHistory={chatHistory}
            isCustomerTyping={isCustomerTyping}
            onSendMessage={handleSendMessage}
            onStartCall={handleStartCall}
            decisionMade={isLoading}
            phoneVerified={phoneVerified}
          />
        </div>
        
        <div id="right-panel-onboarding" className="lg:col-span-1">
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

      {/* Alert Dialog */}
      <AlertDialog
        show={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={() => setShowAlert(false)}
      />

      {/* Newsletter Dialog */}
      <NewsletterDialog
        show={showNewsletter}
        content={newsletterContent}
        day={currentDay - 1} // Show previous day's newsletter
        onClose={() => setShowNewsletter(false)}
      />

      {isCallActive && currentScenario && (
        <PhoneCallModal
          scenario={currentScenario}
          onClose={handlePhoneCallComplete}
        />
      )}
    </>
  );
};

export default GameScreen;