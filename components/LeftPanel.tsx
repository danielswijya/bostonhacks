import React, { useState, useEffect, useRef } from 'react';
import { Scenario, ChatMessage } from '../types';
import { playSound } from '../services/soundService';

interface LeftPanelProps {
  scenario: Scenario | null;
  isLoading: boolean;
  chatHistory: ChatMessage[];
  isCustomerTyping: boolean;
  onSendMessage: (message: string) => void;
  onStartCall: () => void;
  decisionMade: boolean;
}

const CaseDetails: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
    return (
        <div className="mb-4 p-3 bg-black border-2 border-green-500 rounded-none shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <h3 className="font-bold text-green-400 mb-2 font-mono text-lg tracking-wide">TRANSACTION DETAILS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-green-600 font-mono">Transaction Type</p>
                    <p className="text-green-300 font-mono">{scenario.transactionType}</p>
                </div>
                <div>
                    <p className="text-green-600 font-mono">Details</p>
                    <p className="text-green-300 font-mono">{scenario.details}</p>
                </div>
            </div>
        </div>
    );
};


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]"></div>
  </div>
);

const CustomerProfile: React.FC<{ name: string, image: string }> = ({ name, image }) => (
    <div className="flex items-center space-x-4 mb-4 p-3 bg-black border-2 border-green-500 rounded-none shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        <div className="w-24 h-24 bg-black border border-green-600 rounded-none overflow-hidden flex-shrink-0 flex items-center justify-center animate-jump shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            {image ? (
                <img src={`data:image/png;base64,${image}`} alt="Customer" className="w-full h-full object-contain filter brightness-110 contrast-125" style={{imageRendering: 'pixelated'}}/>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-green-600 text-xs font-mono">NO IMAGE</div>
            )}
        </div>
        <div>
            <p className="text-green-600 text-sm font-mono">CLIENT</p>
            <p className="font-bold text-green-300 text-lg font-mono tracking-wide">{name}</p>
        </div>
    </div>
);

const InitialMessage: React.FC<{ scenario: Scenario }> = ({ scenario }) => {
    const [isTranslated, setIsTranslated] = useState(false);
    const needsTranslation = scenario.language !== 'English';

    if (!needsTranslation) {
        return <p>{scenario.initialMessage}</p>;
    }

    return (
        <div>
            <p className={`transition-opacity duration-500 ${isTranslated ? 'opacity-50' : 'opacity-100'}`}>
                {scenario.initialMessage}
            </p>            {!isTranslated && (
                <button 
                    onClick={() => setIsTranslated(true)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-green-100 py-1 px-2 rounded-none mt-2 font-mono border border-green-500"
                >
                    TRANSLATE
                </button>
            )}            {isTranslated && (
                <p className="mt-2 pt-2 border-t border-green-500 animate-fade-in text-green-300 font-mono">
                    {scenario.initialMessageEnglish}
                </p>
            )}
        </div>
    );
};


const ChatWindow: React.FC<{ scenario: Scenario | null, chatHistory: ChatMessage[], isCustomerTyping: boolean }> = ({ scenario, chatHistory, isCustomerTyping }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isCustomerTyping]);    return (
        <div className="flex-grow bg-black border-2 border-green-500 rounded-none p-4 space-y-4 overflow-y-auto shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
            {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.sender === 'user' ? 'bg-green-700 border-green-500' : 'bg-black-700 border-green-500'} text-green-600 p-3 rounded-none max-w-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] border font-mono`}>
                        {index === 0 && scenario ? <InitialMessage scenario={scenario} /> : <p>{msg.text}</p>}
                    </div>
                </div>
            ))}
            {isCustomerTyping && (
                <div className="flex justify-start">
                    <div className="bg-black-700 border-green-500 text-white-500 p-3 rounded-none max-w-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] border font-mono">
                        <p className="animate-pulse">Typing...</p>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>
    );
};

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
    suggestedPrompts: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, suggestedPrompts }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(input);
        setInput('');
    };

    return (        <div className="mt-4">
             <div className="flex gap-2 mb-2 flex-wrap">
                {suggestedPrompts.map(prompt => (
                    <button key={prompt} onClick={() => onSendMessage(prompt)} disabled={disabled} className="text-xs bg-black border border-green-600 hover:bg-green-900/30 hover:border-green-400 text-green-400 py-1 px-2 rounded-none disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-all">
                        {prompt}
                    </button>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={disabled}
                    className="flex-grow bg-black border border-green-500 text-green-400 font-mono rounded-none p-2 focus:outline-none focus:ring-1 focus:ring-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.5)] disabled:bg-gray-900 disabled:border-gray-700 placeholder-green-700"
                    aria-label="Chat input"
                />
                <button type="submit" disabled={disabled} className="bg-green-700 hover:bg-green-600 text-green-100 font-bold p-2 rounded-none disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed font-mono border border-green-500">
                    SEND
                </button>
            </form>
        </div>
    );
};


const LeftPanel: React.FC<LeftPanelProps> = ({ scenario, isLoading, chatHistory, isCustomerTyping, onSendMessage, onStartCall, decisionMade }) => {
  return (
    <div className="bg-black p-6 rounded-none shadow-[0_0_30px_rgba(34,197,94,0.3)] h-full min-h-[700px] flex flex-col border-2 border-green-500">
      <h2 className="text-3xl font-mono text-green-400 border-b-2 border-green-500 pb-2 mb-4 text-center tracking-wider">INCOMING TRANSMISSION</h2>
      {isLoading ? <LoadingSpinner /> : scenario && (
        <div className="flex flex-col flex-grow animate-fade-in h-full">
            <CustomerProfile name={scenario.customerName} image={scenario.customerImage} />
            <CaseDetails scenario={scenario} />
            <div className="mb-4">                <button 
                    onClick={() => {
                        playSound('startCall');
                        onStartCall();
                    }} 
                    disabled={decisionMade}
                    className="w-full bg-black-700 hover:bg-green-600 text-green-300 font-bold py-2 px-4 rounded-none transition-all duration-300 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-lg font-mono border-2 border-green-500 tracking-wider"
                >
                    INITIATE VOICE AUTHENTICATION
                </button>
            </div>
            <div className="flex flex-col flex-grow min-h-0">
                <ChatWindow scenario={scenario} chatHistory={chatHistory} isCustomerTyping={isCustomerTyping} />
                <ChatInput 
                    onSendMessage={onSendMessage} 
                    disabled={decisionMade} 
                    suggestedPrompts={scenario?.suggestedPrompts || []} 
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;