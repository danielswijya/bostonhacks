import { ClientData } from './types';

export const VALID_CLIENTS: ClientData[] = [
  { 
    name: "Alice Johnson", 
    accountNumber: "ACCT-12345678", 
    accountType: "Premium Checking",
    accountStatus: "Active",
    securityNotes: "Client since 2018. Prefers communication via secure bank portal. High transaction volume."
  },
  { 
    name: "Bob Williams", 
    accountNumber: "ACCT-87654321", 
    accountType: "Investment Portfolio",
    accountStatus: "Active",
    securityNotes: "Recently updated phone number. Authorized for wire transfers up to $50k."
  },
  {
    name: "Charlie Brown",
    accountNumber: "ACCT-24681357",
    accountType: "Small Business",
    accountStatus: "Locked",
    securityNotes: "Account frozen due to suspicious international login attempts. Requires voice verification to unlock."
  },
  {
    name: "Diana Prince",
    accountNumber: "ACCT-11223344",
    accountType: "Standard Savings",
    accountStatus: "Active",
    securityNotes: "Low transaction history. Flag any unusual withdrawal requests. Joint account holder is Steve Trevor."
  }
];

export const COMPLIANCE_PROTOCOLS: string[] = [
  "Wire transfers over $10,000 require secondary voice signature verification.",
  "Changes to account contact details (email, phone) must be initiated through the official banking portal, not via chat.",
  "Never ask for passwords, PINs, or full social security numbers.",
  "Official bank communications will not use urgent, threatening language or contain links to non-official login pages.",
  "Grammatical errors and spelling mistakes from official-looking emails are a major red flag for phishing.",
  "Cross-reference all names and account numbers with the client ledger before proceeding."
];

// A much larger, more realistic dataset for the player to search through.
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Nancy", "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Dorothy", "Donald", "Sandra", "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Donna", "Joshua", "Emily", "Kenneth", "Carol", "Kevin", "Michelle", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const accountTypes = ["Premium Checking", "Investment Portfolio", "Small Business", "Standard Savings", "IRA", "Student Account", "Corporate", "Trust Fund"];
const statuses = ["Active", "Active", "Active", "Active", "Active", "Locked", "Closed", "Under Review"];
const notes = ["No issues on record.", "Prefers email communication.", "High net worth individual.", "Frequently changes passwords.", "Account flagged for prior fraud attempt.", "Lost debit card last month.", "Authorized for international transfers.", "Power of attorney on file.", "Requires accessibility accommodations."];

const generatedClients: ClientData[] = [];
const usedNames = new Set(VALID_CLIENTS.map(s => s.name));

while (generatedClients.length < 200) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    if (!usedNames.has(name)) {
        usedNames.add(name);
        generatedClients.push({
            name,
            accountNumber: `ACCT-${Math.floor(10000000 + Math.random() * 90000000)}`,
            accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
            accountStatus: statuses[Math.floor(Math.random() * statuses.length)],
            securityNotes: notes[Math.floor(Math.random() * notes.length)],
        });
    }
}

export const FULL_CLIENT_ROSTER: ClientData[] = [...VALID_CLIENTS, ...generatedClients].sort((a, b) => a.name.localeCompare(b.name));