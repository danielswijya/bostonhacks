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
    title: "Welcome to the IT Help Desk",
    content: "You're a student volunteer at the University IT Help Desk. Your job is to handle student requests, spot scams, and protect the campus network. Let's go over your tools.",
  },
  {
    title: "The Request Panel",
    content: "On the left, you'll see the student's request. You can chat with them, view their profile, and call them to verify their identity. Pay close attention to the details.",
    highlightId: 'left-panel-onboarding',
  },
  {
    title: "The IT Dashboard",
    content: "On the right is your dashboard. Use the 'Student Database' and 'University Policies' tabs to cross-reference information and check for red flags.",
    highlightId: 'tabs-onboarding',
  },
  {
    title: "Make Your Decision",
    content: "Once you have enough information, use the APPROVE or DENY buttons to resolve the case. Incorrect decisions will damage the campus security rating. Good luck.",
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

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);

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
                Skip Tutorial
            </button>
            <button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 text-xl font-display">
                {stepIndex === steps.length - 1 ? "Start Shift" : "Next"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;