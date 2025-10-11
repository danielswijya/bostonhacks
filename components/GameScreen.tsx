import React, { useState, useEffect, useCallback } from 'react';
import { Scenario, ChatMessage } from '../types';
import { generateScenario, generateChatResponse } from '../services/gameService';
import { playSound } from '../services/soundService';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import PhoneCallModal from './PhoneCallModal';
import OnboardingModal from './OnboardingModal';
import EndOfDayModal from './EndOfDayModal';

type DecisionResult = 'correct' | 'incorrect' | 'pending';
interface DayStats {
  correct: number;
  incorrect: number;
}

const CASES_PER_DAY = 5;

const GameScreen: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [decision, setDecision] = useState<DecisionResult>('pending');
  const [campusSecurity, setCampusSecurity] = useState<number>(100);
  const [casesResolved, setCasesResolved] = useState<number>(0);
  const [scamAlert, setScamAlert] = useState<boolean>(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isCustomerTyping, setIsCustomerTyping] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);

  // New state for game loop
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [casesToday, setCasesToday] = useState<number>(0);
  const [dayStats, setDayStats] = useState<DayStats>({ correct: 0, incorrect: 0 });
  const [showEndOfDay, setShowEndOfDay] = useState<boolean>(false);


  const fetchNextScenario = useCallback(async () => {
    setIsLoading(true);
    setScamAlert(false);
    setDecision('pending');
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
    setCurrentDay(prev => prev + 1);
    setCasesToday(0);
    setDayStats({ correct: 0, incorrect: 0 });
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

    if (correctDecision) {
      setDecision('correct');
      setCasesResolved(prev => prev + 1);
      setDayStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setDecision('incorrect');
      const newSecurity = Math.max(0, campusSecurity - 20);
      setCampusSecurity(newSecurity);
      setDayStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      if(currentScenario.isScam){
        setScamAlert(true);
      }
    }
  };
  
  const resetGame = () => {
    setCampusSecurity(100);
    setCasesResolved(0);
    setCurrentDay(1);
    setCasesToday(0);
    setDayStats({ correct: 0, incorrect: 0 });
    setShowEndOfDay(false);
    setShowOnboarding(true); 
    fetchNextScenario();
  };

  if (showOnboarding) {
    return <OnboardingModal onClose={() => setShowOnboarding(false)} />;
  }

  if (campusSecurity <= 0) {
    return (
        <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl animate-fade-in border border-gray-200 dark:border-gray-700">
            <h2 className="text-6xl font-display text-red-600 dark:text-red-500 mb-4">MAJOR SECURITY BREACH</h2>
            <p className="text-xl mb-6 text-gray-700 dark:text-gray-300">Too many incorrect decisions have led to a campus-wide security breach.</p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">Total Cases Resolved: {casesResolved}</p>
            <button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
                Start New Position
            </button>
        </div>
    );
  }

  if (showEndOfDay) {
    return <EndOfDayModal day={currentDay} stats={dayStats} onNextDay={handleStartNextDay} />;
  }

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-shadow duration-500 rounded-lg ${scamAlert ? 'shadow-2xl shadow-red-500/20 dark:shadow-red-500/50' : ''}`}>
        <div id="left-panel-onboarding" className="lg:col-span-1">
          <LeftPanel 
            scenario={currentScenario} 
            isLoading={isLoading}
            chatHistory={chatHistory}
            isCustomerTyping={isCustomerTyping}
            onSendMessage={handleSendMessage}
            onStartCall={() => setIsCallActive(true)}
            decisionMade={decision !== 'pending'}
          />
        </div>
        <div id="right-panel-onboarding" className="lg:col-span-1">
          <RightPanel 
              onDecision={handleDecision}
              isLoading={isLoading}
              decision={decision}
              rationale={currentScenario?.scamRationale || ''}
              cybersecurityTip={currentScenario?.cybersecurityTip || ''}
              onNextCase={handleNextCase}
              campusSecurity={campusSecurity}
              day={currentDay}
              casesToday={casesToday}
              casesPerDay={CASES_PER_DAY}
          />
        </div>
      </div>
      {isCallActive && currentScenario && (
        <PhoneCallModal
          scenario={currentScenario}
          onClose={() => setIsCallActive(false)}
        />
      )}
    </>
  );
};

export default GameScreen;