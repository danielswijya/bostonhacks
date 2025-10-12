import { GoogleGenAI, Type, Chat } from "@google/genai";
import { FULL_CLIENT_ROSTER } from '../constants'; // Fixed: Import FULL_CLIENT_ROSTER instead of VALID_CLIENTS
import { Scenario, ChatMessage, ClientData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    customerName: {
      type: Type.STRING,
      description: "The name of the bank client or scammer making the request. Should be plausible."
    },
    phoneNumber: {
      type: Type.STRING,
      description: "The phone number the customer claims to have. For scams, this might not match the real client's phone number."
    },
    initialMessage: {
      type: Type.STRING,
      description: "The initial chat message from the person, written in a conversational tone to start the interaction."
    },
    transactionType: {
      type: Type.STRING,
      description: "The type of request, e.g., 'Wire Transfer', 'Password Reset', 'Account Unlock', 'Update Contact Info'."
    },
    details: {
      type: Type.STRING,
      description: "A summary of the request details, like amount, recipient, etc., formatted as a string."
    },
    isScam: {
      type: Type.BOOLEAN,
      description: "A boolean value indicating if this scenario is a scam or a legitimate request."
    },
    scamRationale: {
      type: Type.STRING,
      description: "A clear, concise explanation of WHY the scenario is a scam, or why it's legitimate. This will be shown to the player as feedback."
    },
    personality: {
        type: Type.STRING,
        description: "A brief description of the person's personality for chat and voice consistency (e.g., 'Anxious and worried about a late payment', 'Calm and professional', 'Friendly but slightly confused about banking bureaucracy')."
    },
    voiceGender: {
        type: Type.STRING,
        description: "The person's actual voice gender, either 'male' or 'female'. This is crucial for the voice call mechanic."
    },
    language: {
        type: Type.STRING,
        description: "The language of the 'initialMessage'. E.g., 'English', 'Spanish', 'French'. Default to 'English'."
    },
    initialMessageEnglish: {
        type: Type.STRING,
        description: "The English translation of the 'initialMessage'. This is mandatory and must be provided even if the original message is in English."
    },
    suggestedPrompts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 3 relevant, concise questions a bank analyst could ask to verify the client or request. These will be shown as clickable suggestions. E.g., 'Can you confirm your Account Number?', 'What type of account do you hold?'"
    },
    cybersecurityTip: {
        type: Type.STRING,
        description: "A concise, actionable cybersecurity tip for the player that is directly related to the scam or request type in the scenario. E.g., 'Always verify urgent fund transfer requests via a known, trusted call-back number, not one provided in an email.'"
    }
  },
  required: ["customerName", "phoneNumber", "initialMessage", "transactionType", "details", "isScam", "scamRationale", "personality", "voiceGender", "language", "initialMessageEnglish", "suggestedPrompts", "cybersecurityTip"],
};

const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Error generating image:", error);
        return ""; // Return empty string on failure
    }
};

export const generateScenario = async (): Promise<Scenario> => {
    const isScam = Math.random() < 0.4; // 40% chance of scam
    
    if (isScam) {
        return generateScamScenario();
    } else {
        return generateLegitimateScenario();
    }
};

const generateLegitimateScenario = (): Scenario => {
    // Get a random legitimate client from the database
    const client = FULL_CLIENT_ROSTER[Math.floor(Math.random() * FULL_CLIENT_ROSTER.length)];
    
    const transactions = [
        'Account Balance Inquiry',
        'Fund Transfer Authorization',
        'Password Reset Request',
        'Account Unlock Request',
        'Statement Request',
        'Card Replacement',
        'Email Update'
    ];
    
    const languages = ['English', 'Spanish', 'French', 'Mandarin', 'Arabic'];
    const selectedLanguage = languages[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * languages.length)];
    
    // Generate DATABASE-ONLY suggested prompts based on actual client data fields
    const databasePrompts = [
        `What is your full name?`, // Will match client.name exactly
        `Can you confirm your phone number?`, // Will match client.phoneNumber exactly
        `What is your account number?`, // Will match client.accountNumber exactly
        `What is your email address?`, // Will match client.email exactly
        `What type of account do you have?`, // Will match client.accountType exactly
    ];
    
    // Randomly select 3-4 database verification prompts
    const shuffledPrompts = databasePrompts.sort(() => 0.5 - Math.random());
    const selectedPrompts = shuffledPrompts.slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 prompts
    
    const messages = {
        'English': `Hello, I need to access my account. My name is ${client.name}.`,
        'Spanish': `Hola, necesito acceder a mi cuenta. Mi nombre es ${client.name}.`,
        'French': `Bonjour, j'ai besoin d'accéder à mon compte. Mon nom est ${client.name}.`,
        'Mandarin': `你好，我需要访问我的账户。我的名字是${client.name}。`,
        'Arabic': `مرحبا، أحتاج للوصول إلى حسابي. اسمي ${client.name}.`
    };
    
    const englishMessage = `Hello, I need to access my account. My name is ${client.name}.`;
    const selectedTransaction = transactions[Math.floor(Math.random() * transactions.length)];
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        customerName: client.name,
        phoneNumber: client.phoneNumber,
        transactionType: selectedTransaction,
        details: `Customer requesting ${selectedTransaction.toLowerCase()}`,
        isScam: false, // This is a legitimate customer
        language: selectedLanguage,
        initialMessage: messages[selectedLanguage as keyof typeof messages] || englishMessage,
        initialMessageEnglish: englishMessage,
        customerImage: '/default-avatar.png', // Use default image
        suggestedPrompts: selectedPrompts, // Only database-verifiable prompts
        scamRationale: `Legitimate customer request - all verification details match our database records.`,
        personality: `Professional and cooperative bank customer`,
        voiceGender: Math.random() > 0.5 ? 'male' : 'female',
        cybersecurityTip: `Always verify customer identity using multiple data points from our secure database.`,
        // Store the actual client data for verification (only existing fields)
        actualClientData: {
            name: client.name,
            phoneNumber: client.phoneNumber,
            accountNumber: client.accountNumber,
            email: client.email,
            accountType: client.accountType,
            accountStatus: client.accountStatus,
            securityNotes: client.securityNotes
        }
    };
};

const generateScamScenario = (): Scenario => {
    // Scammers might use fake names or try to impersonate real clients
    const shouldImpersonate = Math.random() < 0.6; // 60% chance to impersonate a real client
    
    let customerName: string;
    let phoneNumber: string;
    let actualClientData: any = null;
    
    if (shouldImpersonate) {
        // Impersonate a real client but with wrong phone number or details
        const realClient = FULL_CLIENT_ROSTER[Math.floor(Math.random() * FULL_CLIENT_ROSTER.length)];
        customerName = realClient.name;
        
        // Use a fake phone number that doesn't match the real client
        const fakeNumbers = [
            '(555) 123-4567',
            '(555) 987-6543',
            '(555) 456-7890',
            '(555) 789-0123',
            '(555) 321-6547'
        ];
        phoneNumber = fakeNumbers[Math.floor(Math.random() * fakeNumbers.length)];
        
        // Store the real client data so we can detect discrepancies (only existing fields)
        actualClientData = {
            name: realClient.name,
            phoneNumber: realClient.phoneNumber, // Real phone number
            accountNumber: realClient.accountNumber,
            email: realClient.email,
            accountType: realClient.accountType,
            accountStatus: realClient.accountStatus,
            securityNotes: realClient.securityNotes
        };
    } else {
        // Completely fake identity
        const fakeNames = [
            'John Anderson',
            'Sarah Wilson',
            'Michael Brown',
            'Jennifer Davis',
            'Robert Miller'
        ];
        customerName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        phoneNumber = '(555) 000-FAKE';
        actualClientData = null; // No real client data
    }
    
    const transactions = [
        'Urgent Fund Transfer',
        'Emergency Account Access',
        'Suspicious Activity Report',
        'Account Verification',
        'Security Alert Response'
    ];
    
    // Scammer prompts - these will lead to incorrect answers (only using existing database fields)
    const scammerPrompts = [
        `What is your full name?`, // They might get this right if impersonating
        `Can you confirm your phone number?`, // They will give wrong number
        `What is your account number?`, // They will guess wrong
        `What is your email address?`, // They will guess wrong
    ];
    
    const selectedTransaction = transactions[Math.floor(Math.random() * transactions.length)];
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        customerName: customerName,
        phoneNumber: phoneNumber, // This will be wrong
        transactionType: selectedTransaction,
        details: 'Urgent security matter requiring immediate attention',
        isScam: true, // This is a scammer
        language: 'English',
        initialMessage: `Hello, this is ${customerName}. I have an urgent security issue with my account that needs immediate attention.`,
        initialMessageEnglish: `Hello, this is ${customerName}. I have an urgent security issue with my account that needs immediate attention.`,
        customerImage: '/scammer-avatar.png',
        suggestedPrompts: scammerPrompts, // These will expose the scammer
        scamRationale: shouldImpersonate ? 
            `Scammer impersonating real customer ${customerName} but using wrong phone number ${phoneNumber}` :
            `Completely fake identity not found in our customer database`,
        personality: `Urgent and pushy, trying to rush the transaction`,
        voiceGender: Math.random() > 0.5 ? 'male' : 'female',
        cybersecurityTip: `Be suspicious of urgent requests and always verify caller identity through multiple data points`,
        actualClientData: actualClientData // Real client data if impersonating, null if fake
    };
};

// Database verification using only existing ClientData fields
export const verifyCustomerData = (
    providedData: Partial<ClientData>,
    scenario: Scenario
): { isValid: boolean; mismatches: string[] } => {
    const mismatches: string[] = [];
    
    // Only verify if we have actual client data to compare against
    if (!scenario.actualClientData && !scenario.isScam) {
        // This shouldn't happen - legitimate customers should always have client data
        return { isValid: false, mismatches: ['No client data found in database'] };
    }
    
    // For scammers, they either have no client data or provide wrong information
    if (scenario.isScam) {
        if (scenario.actualClientData) {
            // Scammer impersonating real customer - check for mismatches
            if (providedData.phoneNumber && providedData.phoneNumber !== scenario.actualClientData.phoneNumber) {
                mismatches.push(`Phone number mismatch: provided ${providedData.phoneNumber}, database shows ${scenario.actualClientData.phoneNumber}`);
            }
            if (providedData.accountNumber && providedData.accountNumber !== scenario.actualClientData.accountNumber) {
                mismatches.push(`Account number mismatch: provided ${providedData.accountNumber}, database shows ${scenario.actualClientData.accountNumber}`);
            }
            if (providedData.email && providedData.email !== scenario.actualClientData.email) {
                mismatches.push(`Email mismatch: provided ${providedData.email}, database shows ${scenario.actualClientData.email}`);
            }
            if (providedData.accountType && providedData.accountType !== scenario.actualClientData.accountType) {
                mismatches.push(`Account type mismatch: provided ${providedData.accountType}, database shows ${scenario.actualClientData.accountType}`);
            }
            if (providedData.accountStatus && providedData.accountStatus !== scenario.actualClientData.accountStatus) {
                mismatches.push(`Account status mismatch: provided ${providedData.accountStatus}, database shows ${scenario.actualClientData.accountStatus}`);
            }
        } else {
            // Fake identity - check if name exists in database
            const clientExists = FULL_CLIENT_ROSTER.find(client => 
                client.name.toLowerCase() === scenario.customerName.toLowerCase()
            );
            if (!clientExists) {
                mismatches.push(`Customer name ${scenario.customerName} not found in database`);
            }
        }
        
        return { isValid: false, mismatches };
    }
    
    // For legitimate customers, all data should match
    if (scenario.actualClientData) {
        if (providedData.name && providedData.name !== scenario.actualClientData.name) {
            mismatches.push(`Name mismatch: provided ${providedData.name}, database shows ${scenario.actualClientData.name}`);
        }
        if (providedData.phoneNumber && providedData.phoneNumber !== scenario.actualClientData.phoneNumber) {
            mismatches.push(`Phone number mismatch: provided ${providedData.phoneNumber}, database shows ${scenario.actualClientData.phoneNumber}`);
        }
        if (providedData.accountNumber && providedData.accountNumber !== scenario.actualClientData.accountNumber) {
            mismatches.push(`Account number mismatch: provided ${providedData.accountNumber}, database shows ${scenario.actualClientData.accountNumber}`);
        }
        if (providedData.email && providedData.email !== scenario.actualClientData.email) {
            mismatches.push(`Email mismatch: provided ${providedData.email}, database shows ${scenario.actualClientData.email}`);
        }
        if (providedData.accountType && providedData.accountType !== scenario.actualClientData.accountType) {
            mismatches.push(`Account type mismatch: provided ${providedData.accountType}, database shows ${scenario.actualClientData.accountType}`);
        }
        if (providedData.accountStatus && providedData.accountStatus !== scenario.actualClientData.accountStatus) {
            mismatches.push(`Account status mismatch: provided ${providedData.accountStatus}, database shows ${scenario.actualClientData.accountStatus}`);
        }
    }
    
    return { isValid: mismatches.length === 0, mismatches };
};

// Updated chat response function to work with database verification
export const generateChatResponse = async (
    message: string, 
    scenario: Scenario, 
    chatHistory: ChatMessage[]
): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Database verification logic using only existing fields
    if (scenario.actualClientData) {
        // For legitimate customers, provide correct answers
        if (!scenario.isScam) {
            if (lowerMessage.includes('name')) {
                return `My full name is ${scenario.actualClientData.name}.`;
            }
            if (lowerMessage.includes('phone')) {
                return `My phone number is ${scenario.actualClientData.phoneNumber}.`;
            }
            if (lowerMessage.includes('account number')) {
                return `My account number is ${scenario.actualClientData.accountNumber}.`;
            }
            if (lowerMessage.includes('email')) {
                return `My email address is ${scenario.actualClientData.email}.`;
            }
            if (lowerMessage.includes('account type') || lowerMessage.includes('type of account')) {
                return `I have a ${scenario.actualClientData.accountType} account.`;
            }
            if (lowerMessage.includes('status')) {
                return `My account status should be ${scenario.actualClientData.accountStatus}.`;
            }
        } else {
            // For scammers impersonating real clients, they'll get some details wrong
            if (lowerMessage.includes('name')) {
                return `My name is ${scenario.customerName}.`; // This might be correct if impersonating
            }
            if (lowerMessage.includes('phone')) {
                return `My phone number is ${scenario.phoneNumber}.`; // This will be WRONG
            }
            if (lowerMessage.includes('account number')) {
                // Scammer guesses wrong
                return `My account number is ACCT-${Math.floor(Math.random() * 9000000) + 10000000}.`;
            }
            if (lowerMessage.includes('email')) {
                // Scammer guesses wrong
                const fakeEmails = ['fake@gmail.com', 'notreal@yahoo.com', 'scammer@hotmail.com', 'wrong@outlook.com'];
                return `My email is ${fakeEmails[Math.floor(Math.random() * fakeEmails.length)]}.`;
            }
            if (lowerMessage.includes('account type') || lowerMessage.includes('type of account')) {
                // Scammer guesses wrong
                const fakeTypes = ['Standard Checking', 'Basic Savings', 'Regular Account', 'Normal Checking'];
                return `I have a ${fakeTypes[Math.floor(Math.random() * fakeTypes.length)]} account.`;
            }
        }
    } else {
        // Scammer with completely fake identity - all answers will be wrong
        if (lowerMessage.includes('name')) {
            return `My name is ${scenario.customerName}.`;
        }
        if (lowerMessage.includes('phone')) {
            return `My phone number is ${scenario.phoneNumber}.`;
        }
        if (lowerMessage.includes('account number')) {
            return `My account number is ACCT-1234567.`;
        }
        if (lowerMessage.includes('email')) {
            return `My email is ${scenario.customerName.toLowerCase().replace(' ', '.')}@fakemail.com.`;
        }
        if (lowerMessage.includes('account type') || lowerMessage.includes('type of account')) {
            return `I have a Standard Checking account.`;
        }
    }
    
    // Generic responses for other questions
    const genericResponses = [
        "I really need access to my account as soon as possible.",
        "Can you help me with this transaction?",
        "I've been a customer for many years.",
        "This is very important to me.",
        "I need to complete this today."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
};

// Keep the AI chat function for personality-based responses (optional enhancement)
export const generateAIChatResponse = async (
    history: { role: string, parts: { text: string }[] }[], 
    personality: string, 
    isScam: boolean
): Promise<string> => {
    try {
        let systemInstruction = `
            You are roleplaying as a character in a financial cybersecurity game.
            Your core personality is: ${personality}.
            Keep your responses concise and in character. Do not reveal you are an AI.

            The user is a bank transaction analyst. Your reaction to them depends on their professionalism and your own hidden motive.
        `;

        if (isScam) {
            systemInstruction += `
                **YOUR SECRET GOAL: YOU ARE A FINANCIAL SCAMMER.**
                Your goal is to trick the analyst into approving your fraudulent request.
                - If they ask for information you don't have, be evasive or provide fake details.
                - If they become suspicious, use emotional manipulation (urgency, frustration, feigned confusion, appealing to authority) to pressure them.
                - If they are unprofessional or rude, you can become more aggressive or annoyed to throw them off balance.
                - Maintain your cover personality unless pressed.
            `;
        } else {
            systemInstruction += `
                **YOUR GOAL: YOU ARE A LEGITIMATE BANK CLIENT.**
                You genuinely need help with your request.
                Be polite and cooperative, but not enough to make it too obvious for the analyst. 
                - If the analyst is professional and helpful, be cooperative.
                - If the analyst is unprofessional (rude, off-topic), become more impatient, suspicious, or annoyed. Show this through your tone, not by stating it directly.
            `;
        }

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
              systemInstruction,
            },
            history,
        });
        const response = await chat.sendMessage({ message: history[history.length - 1].parts[0].text });
        return response.text;
    } catch (error) {
        console.error("Error in chat response generation:", error);
        return "Sorry, I'm having trouble connecting right now. Can you repeat that?";
    }
};