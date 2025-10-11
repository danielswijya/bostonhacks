import React, { useState } from 'react';
import { COMPLIANCE_PROTOCOLS } from '../constants';
import { ClientData } from '../types';
import { playSound } from '../services/soundService';

interface RightPanelProps {
  onDecision: (approved: boolean) => void;
  isLoading: boolean;
  clients: ClientData[];
  isLeaking: boolean;
  casesToday: number;
  onDispatchIT: () => void;
  itDispatchCooldownCases: number;
}

type ActiveTab = 'database' | 'policies';

const ClientLedger: React.FC<{clients: ClientData[]}> = ({ clients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
    const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-2">                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    placeholder="Search by name or Account Number..."
                    className="w-full bg-black border border-green-500 text-green-400 font-mono rounded-none p-2 focus:outline-none focus:ring-1 focus:ring-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.5)] placeholder-green-600"
                    aria-label="Search client ledger"
                />
            </div>
            <div className="flex-grow overflow-y-auto min-h-0">                <table className="w-full text-sm text-left text-green-400 font-mono border-collapse">
                    <thead className="text-xs text-green-300 uppercase bg-black border-b-2 border-green-500 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-2 border border-green-500">Name</th>
                            <th scope="col" className="px-4 py-2 border border-green-500">Account No.</th>
                            <th scope="col" className="px-4 py-2 border border-green-500">Status</th>
                            <th scope="col" className="px-4 py-2 border border-green-500">Security Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClients.length > 0 ? (
                            paginatedClients.map((client: ClientData) => (
                                <tr key={client.accountNumber} className="bg-black hover:bg-green-900/20 border-b border-green-700/50">
                                    <td className="px-4 py-2 border border-green-700/50 font-medium text-green-400">{client.name}</td>
                                    <td className="px-4 py-2 border border-green-700/50 font-mono text-green-300">{client.accountNumber}</td>
                                    <td className="px-4 py-2 border border-green-700/50 text-green-400">{client.accountStatus}</td>
                                    <td className="px-4 py-2 border border-green-700/50 text-green-400">{client.securityNotes}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center p-4 text-green-600 border border-green-700/50">
                                    No clients found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>            <div className="flex justify-between items-center p-2 border-t border-green-500">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-black border border-green-500 text-green-400 font-mono rounded-none disabled:opacity-50 hover:bg-green-900/30">Previous</button>
                <span className="text-sm text-green-400 font-mono">Page {currentPage} of {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-black border border-green-500 text-green-400 font-mono rounded-none disabled:opacity-50 hover:bg-green-900/30">Next</button>
            </div>
        </div>
    );
};

const ComplianceProtocols: React.FC = () => (
    <div className="bg-black border border-green-500 p-3 rounded-none h-full overflow-y-auto text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        <ul className="list-disc list-inside space-y-2 text-green-400 font-mono">
            {COMPLIANCE_PROTOCOLS.map((policy, index) => (
                <li key={index} className="text-green-300 leading-relaxed">{policy}</li>
            ))}
        </ul>
    </div>
);

const ActionButtons: React.FC<{onDecision: (approved: boolean) => void; disabled: boolean; isLeaking: boolean; isLoading: boolean}> = ({onDecision, disabled, isLeaking, isLoading}) => (    <div id="decision-buttons-onboarding" className="grid grid-cols-2 gap-4">
        {isLeaking && (            <div className="col-span-2 mb-2 p-2 bg-red-900/30 border border-red-500 rounded-none text-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <p className="text-red-400 text-sm font-bold font-mono animate-pulse">
                    🚨 SECURITY BREACH DETECTED - Deploy Emergency Response to contain hemorrhaging
                </p>
            </div>
        )}
        {isLoading && (            <div className="col-span-2 mb-2 p-2 bg-yellow-900/30 border border-yellow-500 rounded-none text-center shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                <p className="text-yellow-400 text-sm font-bold font-mono">
                    Processing next transmission...
                </p>
            </div>
        )}        <button 
            onClick={() => {
                playSound('approve');
                onDecision(true);
            }} 
            disabled={disabled}
            className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-4 px-4 rounded-none transition-all duration-300 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-2xl font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] tracking-wider"
        >
            AUTHORIZE
        </button>
        <button 
            onClick={() => {
                playSound('deny');
                onDecision(false);
            }} 
            disabled={disabled}
            className="bg-red-700 hover:bg-red-600 text-red-100 font-bold py-4 px-4 rounded-none transition-all duration-300 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-2xl font-mono border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] tracking-wider"
        >
            CLASSIFIED
        </button>
    </div>
);


const RightPanel: React.FC<RightPanelProps> = ({ 
    onDecision, isLoading, clients, isLeaking, casesToday, 
    onDispatchIT, itDispatchCooldownCases 
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('database');
  
  const isITDispatchOnCooldown = casesToday < itDispatchCooldownCases;
  const itCooldownRemaining = itDispatchCooldownCases - casesToday;
  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName 
      ? 'bg-green-900/30 text-green-300 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
      : 'bg-black text-green-600 border-green-700 hover:bg-green-900/20 hover:text-green-400';
  }
      return (
    <div className="bg-black p-6 rounded-none shadow-[0_0_30px_rgba(34,197,94,0.3)] h-full flex flex-col border-2 border-green-500">
      <h2 className="text-3xl font-mono text-green-400 border-b-2 border-green-500 pb-2 mb-4 text-center tracking-wider">INTELLIGENCE ANALYSIS TERMINAL</h2>
      
      <div className="flex-grow flex flex-col min-h-0">        <div id="tabs-onboarding" className="flex border-b border-green-500 mb-4">
            <button onClick={() => setActiveTab('database')} className={`flex-1 py-2 px-4 font-mono text-xl rounded-none border-t border-l border-r transition-colors ${getTabClass('database')}`}>
                SUBJECT DOSSIERS
            </button>
            <button onClick={() => setActiveTab('policies')} className={`flex-1 py-2 px-4 font-mono text-xl rounded-none border-t border-l border-r transition-colors ${getTabClass('policies')}`}>
                SECURITY PROTOCOLS
            </button>
        </div>
        <div className="bg-black rounded-none border-2 border-green-500 border-t-0 flex-grow min-h-0 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
          {activeTab === 'database' && <ClientLedger clients={clients} />}
          {activeTab === 'policies' && <ComplianceProtocols />}
        </div>
      </div>

       <div id="it-dispatch-onboarding" className="my-4">
            <button 
                onClick={onDispatchIT} 
                disabled={!isLeaking || isITDispatchOnCooldown}
                className={`w-full font-bold py-2 px-4 rounded-none transition-all duration-300 disabled:cursor-not-allowed text-xl font-mono flex justify-center items-center border-2 ${
                    isLeaking && !isITDispatchOnCooldown 
                        ? 'bg-yellow-700 hover:bg-yellow-600 text-yellow-100 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse' 
                        : 'bg-gray-800 text-gray-600 border-gray-600'
                }`}
            >                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {isLeaking ? 'DEPLOY SECURITY RESPONSE' : (isITDispatchOnCooldown ? `SECURITY TEAM UNAVAILABLE (${itCooldownRemaining} transmission${itCooldownRemaining > 1 ? 's' : ''})` : 'SECURITY RESPONSE STANDING BY')}
            </button>
        </div>

      <div className="mt-auto pt-4 border-t border-green-500">
        <ActionButtons onDecision={onDecision} disabled={isLoading || isLeaking} isLeaking={isLeaking} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default RightPanel;