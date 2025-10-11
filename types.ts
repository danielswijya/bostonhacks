export interface Scenario {
  customerName: string;
  initialMessage: string;
  transactionType: string;
  details: string;
  isScam: boolean;
  scamRationale: string;
  customerImage: string; // base64 image string
  personality: string; // A short description for the AI's persona
  voiceGender: 'male' | 'female'; // The expected voice gender for phone calls
  language: string; // e.g., "English", "Spanish"
  initialMessageEnglish: string; // The English translation of the initial message
  suggestedPrompts: string[]; // AI-generated relevant questions for the teller
  cybersecurityTip: string; // An educational tip related to the scenario
}

export interface ClientData {
  name: string;
  accountNumber: string;
  accountType: string;
  accountStatus: string;
  securityNotes: string;
}

export interface ChatMessage {
  sender: 'user' | 'customer';
  text: string;
}

export interface SystemAlert {
  id: number;
  message: string;
  type: 'error' | 'info' | 'success';
}

export interface ResolvedCase {
  scenario: Scenario;
  playerDecision: 'approved' | 'denied';
  isCorrect: boolean;
}
