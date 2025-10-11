import React, { useState } from 'react';
import { COMPLIANCE_PROTOCOLS } from '../constants';
import { ClientData } from '../types';
import { playSound } from '../services/soundService';

interface RightPanelProps {
  onDecision: (approved: boolean) => void;
  isLoading: boolean;
  clients: ClientData[];
  bankCapital: number;
  maxBankCapital: number;
  isLeaking: boolean;
  day: number;
  casesToday: number;
  casesPerDay: number;
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
            <div className="p-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    placeholder="Search by name or Account Number..."
                    className="w-full bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Search client ledger"
                />
            </div>
            <div className="flex-grow overflow-y-auto min-h-0">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 border-collapse">
                    <thead className="text-xs text-green-700 dark:text-green-400 uppercase bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Name</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Account No.</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Status</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Security Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClients.length > 0 ? (
                            paginatedClients.map((client: ClientData) => (
                                <tr key={client.accountNumber} className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 font-medium">{client.name}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 font-mono">{client.accountNumber}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">{client.accountStatus}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">{client.securityNotes}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center p-4 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                                    No clients found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center p-2 border-t border-gray-300 dark:border-gray-600">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Previous</button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50">Next</button>
            </div>
        </div>
    );
};

const ComplianceProtocols: React.FC = () => (
    <div className="bg-gray-200 dark:bg-gray-900 p-3 rounded-md h-full overflow-y-auto text-sm border border-gray-300 dark:border-gray-700">
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {COMPLIANCE_PROTOCOLS.map((policy, index) => (
                <li key={index}>{policy}</li>
            ))}
        </ul>
    </div>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const StatusBar: React.FC<{bankCapital: number; maxBankCapital: number; isLeaking: boolean; day: number; casesToday: number; casesPerDay: number}> = ({bankCapital, maxBankCapital, isLeaking, day, casesToday, casesPerDay}) => {
    const capitalPercentage = (bankCapital / maxBankCapital) * 100;
    
    return (
        <div className="mb-6">
            <h3 className="font-bold text-green-600 dark:text-green-400 font-display text-2xl mb-2">Analyst Status</h3>
            <div className="bg-gray-200 dark:bg-gray-900 p-3 rounded-md border border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <p>Trading Day:</p>
                    <span className="font-bold text-gray-900 dark:text-white">{day}</span>
                </div>
                 <div className="flex justify-between items-center mt-2">
                    <p>Case:</p> 
                    <span className="font-bold text-gray-900 dark:text-white">{casesToday + 1} / {casesPerDay}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <p className={`${isLeaking ? 'text-red-500 animate-pulse' : ''}`}>Bank Capital:</p>
                    <div className="flex items-center">
                        <span className={`font-bold font-mono text-gray-900 dark:text-white mr-2 ${isLeaking ? 'text-red-500 animate-pulse' : ''}`}>{formatCurrency(bankCapital)}</span>
                    </div>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className={`${isLeaking ? 'bg-red-500' : 'bg-green-500'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${capitalPercentage}%` }}></div>
                </div>
            </div>
        </div>
    )
}

const ActionButtons: React.FC<{onDecision: (approved: boolean) => void; disabled: boolean; isLeaking: boolean; isLoading: boolean}> = ({onDecision, disabled, isLeaking, isLoading}) => (
    <div id="decision-buttons-onboarding" className="grid grid-cols-2 gap-4">
        {isLeaking && (
            <div className="col-span-2 mb-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-center">
                <p className="text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
                    🚨 CAPITAL LEAK DETECTED - Use IT Dispatch to restore system control
                </p>
            </div>
        )}
        {isLoading && (
            <div className="col-span-2 mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">
                    Loading next case...
                </p>
            </div>
        )}
        <button 
            onClick={() => {
                playSound('approve');
                onDecision(true);
            }} 
            disabled={disabled}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-2xl font-display"
        >
            APPROVE
        </button>
        <button 
            onClick={() => {
                playSound('deny');
                onDecision(false);
            }} 
            disabled={disabled}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-2xl font-display"
        >
            DENY
        </button>
    </div>
);


const RightPanel: React.FC<RightPanelProps> = ({ 
    onDecision, isLoading, clients,
    bankCapital, maxBankCapital, isLeaking, day, casesToday, casesPerDay, 
    onDispatchIT, itDispatchCooldownCases 
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('database');
  
  const isITDispatchOnCooldown = casesToday < itDispatchCooldownCases;
  const itCooldownRemaining = itDispatchCooldownCases - casesToday;

  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName 
      ? 'bg-gray-200 dark:bg-gray-900 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-700'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
  }
    
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-display text-green-600 dark:text-green-400 border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">Transaction Analysis Terminal</h2>
      <StatusBar bankCapital={bankCapital} maxBankCapital={maxBankCapital} isLeaking={isLeaking} day={day} casesToday={casesToday} casesPerDay={casesPerDay} />
      
      <div className="flex-grow flex flex-col min-h-0">
        <div id="tabs-onboarding" className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
            <button onClick={() => setActiveTab('database')} className={`flex-1 py-2 px-4 font-display text-xl rounded-t-lg border-t border-l border-r transition-colors ${getTabClass('database')}`}>
                Client Ledger
            </button>
            <button onClick={() => setActiveTab('policies')} className={`flex-1 py-2 px-4 font-display text-xl rounded-t-lg border-t border-l border-r transition-colors ${getTabClass('policies')}`}>
                Compliance Protocols
            </button>
        </div>
        <div className="bg-gray-200 dark:bg-gray-900 rounded-b-lg border border-gray-300 dark:border-gray-700 border-t-0 flex-grow min-h-0">
          {activeTab === 'database' && <ClientLedger clients={clients} />}
          {activeTab === 'policies' && <ComplianceProtocols />}
        </div>
      </div>

       <div id="it-dispatch-onboarding" className="my-4">
            <button 
                onClick={onDispatchIT} 
                disabled={!isLeaking || isITDispatchOnCooldown}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-300 text-xl font-display flex justify-center items-center"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {isLeaking ? 'DISPATCH IT SECURITY' : (isITDispatchOnCooldown ? `IT ON COOLDOWN (${itCooldownRemaining} case${itCooldownRemaining > 1 ? 's' : ''})` : 'IT SECURITY STANDING BY')}
            </button>
        </div>      <div className="mt-auto pt-4 border-t border-gray-300 dark:border-gray-700">
        <ActionButtons onDecision={onDecision} disabled={isLoading || isLeaking} isLeaking={isLeaking} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default RightPanel;