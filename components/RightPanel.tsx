import React, { useState } from 'react';
import { UNIVERSITY_POLICIES, ALL_STUDENTS } from '../constants';
import { StudentData } from '../types';
import { playSound } from '../services/soundService';

interface RightPanelProps {
  onDecision: (approved: boolean) => void;
  isLoading: boolean;
  decision: 'correct' | 'incorrect' | 'pending';
  rationale: string;
  cybersecurityTip: string;
  onNextCase: () => void;
  campusSecurity: number;
  day: number;
  casesToday: number;
  casesPerDay: number;
}

type ActiveTab = 'database' | 'policies';

const StudentDatabase: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = ALL_STUDENTS.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or Student ID..."
                    className="w-full bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label="Search student database"
                />
            </div>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 border-collapse">
                    <thead className="text-xs text-green-700 dark:text-green-400 uppercase bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Name</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Student ID</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Major</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Status</th>
                            <th scope="col" className="px-4 py-2 border border-gray-300 dark:border-gray-600">Security Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student: StudentData) => (
                                <tr key={student.studentId} className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 font-medium">{student.name}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 font-mono">{student.studentId}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">{student.major}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">{student.enrollmentStatus}</td>
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">{student.securityNotes}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center p-4 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UniversityPolicies: React.FC = () => (
    <div className="bg-gray-200 dark:bg-gray-900 p-3 rounded-md h-full overflow-y-auto text-sm border border-gray-300 dark:border-gray-700">
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {UNIVERSITY_POLICIES.map((policy, index) => (
                <li key={index}>{policy}</li>
            ))}
        </ul>
    </div>
);

const StatusBar: React.FC<{campusSecurity: number; day: number; casesToday: number; casesPerDay: number}> = ({campusSecurity, day, casesToday, casesPerDay}) => (
    <div className="mb-6">
        <h3 className="font-bold text-green-600 dark:text-green-400 font-display text-2xl mb-2">Shift Status</h3>
        <div className="bg-gray-200 dark:bg-gray-900 p-3 rounded-md border border-gray-300 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <p>Day:</p>
                <span className="font-bold text-gray-900 dark:text-white">{day}</span>
            </div>
             <div className="flex justify-between items-center mt-2">
                <p>Case:</p> 
                <span className="font-bold text-gray-900 dark:text-white">{casesToday + 1} / {casesPerDay}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
                <p>Campus Security:</p>
                <div className="flex items-center">
                    <span className="font-bold text-gray-900 dark:text-white mr-2">{campusSecurity}%</span>
                    <div className="w-24 bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-green-500 dark:bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${campusSecurity}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

const ActionButtons: React.FC<{onDecision: (approved: boolean) => void; disabled: boolean}> = ({onDecision, disabled}) => (
    <div id="decision-buttons-onboarding" className="grid grid-cols-2 gap-4">
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

const FeedbackDisplay: React.FC<{decision: 'correct'|'incorrect'; rationale: string; cybersecurityTip: string; onNextCase: () => void;}> = ({decision, rationale, cybersecurityTip, onNextCase}) => {
    const isCorrect = decision === 'correct';
    const bgColor = isCorrect ? 'bg-green-100 dark:bg-green-900 border-green-500' : 'bg-red-100 dark:bg-red-900 border-red-500';
    const titleColor = isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400';
    const title = isCorrect ? 'DECISION CORRECT' : 'DECISION INCORRECT';

    return (
        <div className={`p-4 rounded-lg border ${bgColor} animate-slide-in-bottom`}>
            <h3 className={`font-bold text-2xl font-display ${titleColor} mb-2`}>{title}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{rationale}</p>
            
            <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Cybersecurity Tip
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{cybersecurityTip}</p>
            </div>

            <button 
                onClick={onNextCase}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-xl font-display"
            >
                Next Case
            </button>
        </div>
    )
};

const RightPanel: React.FC<RightPanelProps> = ({ onDecision, isLoading, decision, rationale, cybersecurityTip, onNextCase, campusSecurity, day, casesToday, casesPerDay }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('database');

  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName 
      ? 'bg-gray-200 dark:bg-gray-900 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-700'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
  }
    
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-display text-green-600 dark:text-green-400 border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">IT Help Desk Dashboard</h2>
      <StatusBar campusSecurity={campusSecurity} day={day} casesToday={casesToday} casesPerDay={casesPerDay} />
      
      <div className="flex-grow flex flex-col min-h-0">
        <div id="tabs-onboarding" className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
            <button onClick={() => setActiveTab('database')} className={`flex-1 py-2 px-4 font-display text-xl rounded-t-lg border-t border-l border-r transition-colors ${getTabClass('database')}`}>
                Student Database
            </button>
            <button onClick={() => setActiveTab('policies')} className={`flex-1 py-2 px-4 font-display text-xl rounded-t-lg border-t border-l border-r transition-colors ${getTabClass('policies')}`}>
                University Policies
            </button>
        </div>
        <div className="bg-gray-200 dark:bg-gray-900 rounded-b-lg border border-gray-300 dark:border-gray-700 border-t-0 flex-grow min-h-0">
          {activeTab === 'database' && <StudentDatabase />}
          {activeTab === 'policies' && <UniversityPolicies />}
        </div>
      </div>

      <div className="mt-6">
        {decision === 'pending' ? (
          <ActionButtons onDecision={onDecision} disabled={isLoading} />
        ) : (
          <FeedbackDisplay decision={decision} rationale={rationale} cybersecurityTip={cybersecurityTip} onNextCase={onNextCase} />
        )}
      </div>
    </div>
  );
};

export default RightPanel;