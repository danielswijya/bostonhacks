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
        <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Case Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Transaction Type</p>
                    <p className="text-gray-800 dark:text-gray-200">{scenario.transactionType}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Details</p>
                    <p className="text-gray-800 dark:text-gray-200">{scenario.details}</p>
                </div>
            </div>
        </div>
    );
};


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 dark:border-green-400"></div>
  </div>
);

const CustomerProfile: React.FC<{ name: string, image: string }> = ({ name, image }) => (
    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-200 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700">
        <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center animate-jump">
            {image ? (
                <img src={`data:image/png;base64,${image}`} alt="Customer" className="w-full h-full object-contain" style={{imageRendering: 'pixelated'}}/>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
            )}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Requester</p>
            <p className="font-bold text-gray-900 dark:text-white text-lg">{name}</p>
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
            </p>
            {!isTranslated && (
                <button 
                    onClick={() => setIsTranslated(true)}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded-md mt-2"
                >
                    Translate
                </button>
            )}
            {isTranslated && (
                <p className="mt-2 pt-2 border-t border-blue-500 animate-fade-in">
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
    }, [chatHistory, isCustomerTyping]);

    return (
        <div className="flex-grow bg-gray-200 dark:bg-gray-900 rounded-lg p-4 space-y-4 overflow-y-auto border border-gray-300 dark:border-gray-700">
            {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.sender === 'user' ? 'bg-green-600' : 'bg-blue-600'} text-white p-3 rounded-lg max-w-lg shadow-md`}>
                        {index === 0 && scenario ? <InitialMessage scenario={scenario} /> : <p>{msg.text}</p>}
                    </div>
                </div>
            ))}
            {isCustomerTyping && (
                <div className="flex justify-start">
                    <div className="bg-blue-600 text-white p-3 rounded-lg max-w-lg shadow-md">
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

    return (
        <div className="mt-4">
             <div className="flex gap-2 mb-2 flex-wrap">
                {suggestedPrompts.map(prompt => (
                    <button key={prompt} onClick={() => onSendMessage(prompt)} disabled={disabled} className="text-xs bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 py-1 px-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
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
                    className="flex-grow bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    aria-label="Chat input"
                />
                <button type="submit" disabled={disabled} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Send
                </button>
            </form>
        </div>
    );
};


const LeftPanel: React.FC<LeftPanelProps> = ({ scenario, isLoading, chatHistory, isCustomerTyping, onSendMessage, onStartCall, decisionMade }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full min-h-[700px] flex flex-col border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-display text-green-600 dark:text-green-400 border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">Request Panel</h2>
      {isLoading ? <LoadingSpinner /> : scenario && (
        <div className="flex flex-col flex-grow animate-fade-in h-full">
            <CustomerProfile name={scenario.customerName} image={scenario.customerImage} />
            <CaseDetails scenario={scenario} />
            <div className="mb-4">
                <button 
                    onClick={() => {
                        playSound('startCall');
                        onStartCall();
                    }} 
                    disabled={decisionMade}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-lg font-display"
                >
                    Call Customer to Verify
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