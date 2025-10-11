import { GoogleGenAI, Type, Chat } from "@google/genai";
import { VALID_CLIENTS, COMPLIANCE_PROTOCOLS } from '../constants';
import { Scenario } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    customerName: {
      type: Type.STRING,
      description: "The name of the bank client or scammer making the request. Should be plausible."
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
  required: ["customerName", "initialMessage", "transactionType", "details", "isScam", "scamRationale", "personality", "voiceGender", "language", "initialMessageEnglish", "suggestedPrompts", "cybersecurityTip"],
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
  try {
    // Select a random client from VALID_CLIENTS
    const client = VALID_CLIENTS[Math.floor(Math.random() * VALID_CLIENTS.length)];

    // Generate scenario using the selected client's info
    const prompt = `
      You are a game master for a financial cybersecurity game called "Aegis Sentinel".
      The player is a Transaction Analyst at a high-stakes financial institution.
      Your role is to generate scenarios involving client requests. Some must be legitimate, others must be sophisticated phishing or scam attempts.
      The context is a tense world of financial cyberwarfare.
      You must return your response in JSON format according to the provided schema.

      Use the following information as the ground truth for the game.
      
      **Client for this scenario:**
      Name: ${client.name}
      Account Number: ${client.accountNumber}
      Account Type: ${client.accountType}
      Account Status: ${client.accountStatus}
      Security Notes: ${client.securityNotes}

      **Federal Compliance Protocols:**
      ${COMPLIANCE_PROTOCOLS.map(p => `- ${p}`).join('\n')}

      **Scenario Generation Rules:**
      1.  **Context:** Scenarios should be relevant to banking and finance. Examples: urgent wire transfers, business email compromise, phishing from 'executives', account lockouts, suspicious login alerts.
      2.  **Scam Nuances:** Scam red flags should be subtle. Examples:
          - A slightly misspelled name ("Alice Johnsen").
          - A request violating a minor compliance protocol.
          - Use of intense emotional manipulation (e.g., "This deal will fall through if the wire isn't sent in the next 10 minutes!").
          - **Voice Mismatch:** Occasionally create a gender mismatch where a scammer poses as a client of a different gender. Set 'voiceGender' to the scammer's true voice.
      3.  **Educational Tips:** For every scenario, provide a relevant 'cybersecurityTip'. The tip must be practical advice related to the situation.
      4.  **Languages:** Occasionally (25% of the time), generate the 'initialMessage' in a language other than English (like Spanish or French), and provide the English translation in 'initialMessageEnglish'.
      5.  **Suggested Prompts:** Generate 3 relevant, short questions an analyst might ask to verify this specific scenario.
      
  Generate a new, unique scenario now. The customerName, accountNumber, accountType, accountStatus, and securityNotes must match the client info above.
  IMPORTANT: The scenario can be either a legitimate request or a sophisticated scam/phishing attempt, even if the client is real. Scams should sometimes use real client info to increase realism and challenge the player.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        temperature: 1.0,
      },
    });

    const jsonText = response.text.trim();
    const scenarioTextData = JSON.parse(jsonText);

    const customerImageB64 = await generateImage(`16-bit pixel art style, professional headshot of a person named ${client.name}, on a plain light gray background. Retro video game style, centered.`);

    // Return scenario with client info enforced
    return {
      ...scenarioTextData,
      customerName: client.name,
      accountNumber: client.accountNumber,
      accountType: client.accountType,
      accountStatus: client.accountStatus,
      securityNotes: client.securityNotes,
      customerImage: customerImageB64
    };

  } catch (error) {
    console.error("Error generating scenario with Gemini:", error);
    return {
      customerName: "API Error",
      initialMessage: "There was an issue generating the next case. The system might be down. Please try again. This is a legitimate system message.",
      transactionType: "System Alert",
      details: "Error connecting to the scenario generator.",
      isScam: false,
      scamRationale: "This is a fallback message due to an API error. It is not a scam.",
      customerImage: "",
      personality: "System AI",
      voiceGender: "male",
      language: "English",
      initialMessageEnglish: "There was an issue generating the next case. The system might be down. Please try again. This is a legitimate system message.",
      suggestedPrompts: [
          "Is the system stable?",
          "Can you run a diagnostic?",
          "Should I refresh the page?"
      ],
      cybersecurityTip: "When encountering system errors, it's wise to check official status pages or contact internal support rather than trusting prompts that could be spoofed."
    };
  }
};


export const generateChatResponse = async (history: { role: string, parts: { text: string }[] }[], personality: string, isScam: boolean): Promise<string> => {
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