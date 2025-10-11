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

export interface StudentData {
  name: string;
  studentId: string;
  major: string;
  enrollmentStatus: string;
  securityNotes: string;
}

export interface ChatMessage {
  sender: 'user' | 'customer';
  text: string;
}