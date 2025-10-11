import React, { useState, useLayoutEffect } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

interface Step {
  title: string;
  content: string;
  highlightId?: string;
}

const steps: Step[] = [
  {
    title: "Welcome to the Financial Crimes Unit",
    content: "You are a Transaction Analyst at Aegis Global Bank. Your primary duty is to protect the bank's liquid capital from a global network of cybercriminals. The market is watching.",
  },
  {
    title: "The Transaction Request",
    content: "On the left is the client's request. You can chat with them, view their profile, and initiate a 'Voice Signature Verification' call to gather intelligence.",
    highlightId: 'left-panel-onboarding',
  },
  {
    title: "The Analysis Terminal",
    content: "On the right is your terminal. Use the 'Client Ledger' and 'Compliance Protocols' to cross-reference every detail. A single mistake can trigger a crisis.",
    highlightId: 'tabs-onboarding',
  },
  {
    title: "Capital Leaks & IT Dispatch",
    content: "If you approve a fraudulent transaction, it will trigger a real-time Capital Leak. Use the 'Dispatch IT Security' button to stop the leak, but be warned: the team has a cooldown period after each deployment.",
    highlightId: 'it-dispatch-onboarding',
  },
  {
    title: "Authorize or Deny",
    content: "Once your analysis is complete, use the APPROVE or DENY buttons. Incorrect decisions will damage the bank's capital. Denying a legitimate client also has a financial penalty. Good luck.",
    highlightId: 'decision-buttons-onboarding',
  }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const currentStep = steps[stepIndex];

  useLayoutEffect(() => {
    const updateHighlight = () => {
      if (currentStep.highlightId) {
        const element = document.getElementById(currentStep.highlightId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightStyle({
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
        }
      } else {
        setHighlightStyle({});
      }
    };

    // Delay to allow layout to settle
    const timeoutId = setTimeout(updateHighlight, 50);
    window.addEventListener('resize', updateHighlight);
    
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateHighlight);
    }

  }, [stepIndex, currentStep.highlightId]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
       {currentStep.highlightId && Object.keys(highlightStyle).length > 0 && <div className="highlight-pulse" style={highlightStyle} />}
      <div className="bg-white dark:bg-gray-800 border border-green-500 rounded-lg shadow-2xl p-8 max-w-lg w-full text-center relative z-100">
        <h2 className="text-4xl font-display text-green-600 dark:text-green-400 mb-4">{currentStep.title}</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">{currentStep.content}</p>
        <div className="flex justify-between items-center">
            <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Skip Briefing
            </button>
            <button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 text-xl font-display">
                {stepIndex === steps.length - 1 ? "Protect Capital" : "Next"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
