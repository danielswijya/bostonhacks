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
    title: "BROKEN BONDS",
    content: "You are Agent designation: FINANCIAL ANALYST, Broken Bonds Global Bank Counter-Intelligence Division. Your mission: Identify and neutralize enemy financial infiltration attempts. The Cold War has moved to the banking sector.",
  },
  {
    title: "SUBJECT INTERROGATION TERMINAL",
    content: "Left terminal displays incoming transmission requests from potential hostile agents. Utilize secure chat protocols and initiate 'Voice Authentication' to extract intelligence and verify subject identity.",
    highlightId: 'left-panel-onboarding',
  },
  {
    title: "SURVEILLANCE DATABASE ACCESS",
    content: "Right terminal provides access to classified intelligence networks. Cross-reference 'Subject Dossiers' and 'Security Protocols' to identify enemy operatives. One security breach could compromise national assets.",
    highlightId: 'tabs-onboarding',
  },
  {
    title: "CAPITAL BREACH PROTOCOL",
    content: "Approving hostile transactions triggers immediate capital hemorrhaging. Deploy 'Emergency Security Response' to contain breaches, but field teams require operational cooldown between deployments.",
    highlightId: 'it-dispatch-onboarding',
  },
  {
    title: "AUTHORIZATION CLEARANCE",
    content: "Complete analysis, then issue AUTHORIZATION or DENIAL clearance codes. Incorrect assessments compromise national financial security. Denying legitimate assets also incurs operational penalties. The nation depends on your judgment.",
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
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 animate-fade-in">
       {currentStep.highlightId && Object.keys(highlightStyle).length > 0 && <div className="highlight-pulse" style={highlightStyle} />}
      <div className="bg-black border-2 border-green-500 rounded-none shadow-[0_0_50px_rgba(34,197,94,0.8)] p-8 max-w-lg w-full text-center relative z-100">
        <h2 className="text-4xl font-mono text-green-400 mb-4 tracking-wider">{currentStep.title}</h2>
        <p className="text-green-300 mb-6 text-lg font-mono leading-relaxed">{currentStep.content}</p>
        <div className="flex justify-between items-center">            <button onClick={handleSkip} className="text-green-600 hover:text-green-400 font-mono transition-colors tracking-wider">
                SKIP CLASSIFIED BRIEFING
            </button>
            <button onClick={handleNext} className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-2 px-6 rounded-none transition-all duration-300 text-xl font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-wider">
                {stepIndex === steps.length - 1 ? "BEGIN OPERATION" : "CONTINUE BRIEFING"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
