// ...existing code...

import { ClientData } from './types';

// Generate a realistic client dataset using common names
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Nancy", "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Dorothy", "Donald", "Sandra", "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Donna", "Joshua", "Emily", "Kenneth", "Carol", "Kevin", "Michelle", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const accountTypes = ["Premium Checking", "Investment Portfolio", "Small Business", "Standard Savings", "IRA", "Student Account", "Corporate", "Trust Fund"];
const statuses = ["Active", "Active", "Active", "Active", "Active", "Locked", "Closed", "Under Review"];
const notes = ["No issues on record.", "Prefers email communication.", "High net worth individual.", "Frequently changes passwords.", "Account flagged for prior fraud attempt.", "Lost debit card last month.", "Authorized for international transfers.", "Power of attorney on file.", "Requires accessibility accommodations."];
const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "comcast.net", "verizon.net", "sbcglobal.net", "att.net"];

// Helper function to generate email
const generateEmail = (firstName: string, lastName: string, index: number): string => {
  const domain = emailDomains[index % emailDomains.length];
  const patterns = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${(index % 99) + 1}@${domain}`,
    `${firstName.toLowerCase().charAt(0)}${lastName.toLowerCase()}@${domain}`
  ];
  return patterns[index % patterns.length];
};

// Helper function to generate phone number
const generatePhoneNumber = (index: number): string => {
  const areaCodes = ["212", "310", "415", "617", "312", "713", "214", "305", "404", "206"];
  const areaCode = areaCodes[index % areaCodes.length];
  const exchange = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  const number = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  return `(${areaCode}) ${exchange}-${number}`;
};

export const VALID_CLIENTS: ClientData[] = [];
const desiredClientCount = 100;
const usedPairs = new Set<string>();
let i = 0;
while (VALID_CLIENTS.length < desiredClientCount) {
  let firstIdx, lastIdx, name;
  do {
    firstIdx = Math.floor(Math.random() * firstNames.length);
    lastIdx = Math.floor(Math.random() * lastNames.length);
    name = `${firstNames[firstIdx]} ${lastNames[lastIdx]}`;
  } while (firstIdx === lastIdx || usedPairs.has(name));
  usedPairs.add(name);
  VALID_CLIENTS.push({
    name,
    accountNumber: `ACCT-${10000000 + i}`,
    accountType: accountTypes[i % accountTypes.length],
    accountStatus: statuses[i % statuses.length],
    securityNotes: notes[i % notes.length],
    email: generateEmail(firstNames[firstIdx], lastNames[lastIdx], i),
    phoneNumber: generatePhoneNumber(i),
  });
  i++;
}
// End of VALID_CLIENTS generation
export const FULL_CLIENT_ROSTER: ClientData[] = [...VALID_CLIENTS].sort((a, b) => a.name.localeCompare(b.name));

export const COMPLIANCE_PROTOCOLS: string[] = [
  "Wire transfers over $10,000 require secondary voice signature verification.",
  "Changes to account contact details (email, phone) must be initiated through the official banking portal, not via chat.",
  "Never ask for passwords, PINs, or full social security numbers.",
  "Official bank communications will not use urgent, threatening language or contain links to non-official login pages.",
  "Grammatical errors and spelling mistakes from official-looking emails are a major red flag for phishing.",
  "Cross-reference all names and account numbers with the client ledger before proceeding."
];
