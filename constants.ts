import { StudentData } from './types';

export const VALID_STUDENTS: StudentData[] = [
  { 
    name: "Alice Johnson", 
    studentId: "STU-12345678", 
    major: "Computer Science",
    enrollmentStatus: "Enrolled",
    securityNotes: "Student since 2022. Prefers communication via university portal."
  },
  { 
    name: "Bob Williams", 
    studentId: "STU-87654321", 
    major: "Fine Arts",
    enrollmentStatus: "Enrolled",
    securityNotes: "Recently updated phone number. On scholarship."
  },
  {
    name: "Charlie Brown",
    studentId: "STU-24681357",
    major: "Engineering",
    enrollmentStatus: "On Leave",
    securityNotes: "Currently on a study abroad program. May have international login attempts."
  },
  {
    name: "Diana Prince",
    studentId: "STU-11223344",
    major: "History",
    enrollmentStatus: "Enrolled",
    securityNotes: "Has a work-study job at the library. Verify financial aid requests."
  }
];

export const UNIVERSITY_POLICIES: string[] = [
  "Financial aid disbursements over $1,000 require secondary verification (voice call or in-person).",
  "Account detail changes (email, phone) must be initiated through the official student portal, not via chat.",
  "Never ask for passwords, recovery codes, or full security question answers.",
  "Official university communications will not use urgent, threatening language or contain links to external login pages.",
  "Grammatical errors and spelling mistakes from official-looking emails can be a red flag.",
  "Cross-reference all names and student IDs with the student database."
];

// A much larger, more realistic dataset for the player to search through.
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Nancy", "Matthew", "Lisa", "Anthony", "Betty", "Mark", "Dorothy", "Donald", "Sandra", "Steven", "Ashley", "Paul", "Kimberly", "Andrew", "Donna", "Joshua", "Emily", "Kenneth", "Carol", "Kevin", "Michelle", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const majors = ["Computer Science", "Fine Arts", "Engineering", "History", "Biology", "Business Administration", "Psychology", "Nursing", "Communications", "Political Science", "Economics", "Chemistry", "Physics", "English Literature", "Sociology"];
const statuses = ["Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "On Leave", "Graduated", "Withdrawn"];
const notes = ["No issues on record.", "Prefers email communication.", "Has a work-study job on campus.", "Frequently changes passwords.", "On academic probation.", "Lost ID card last semester.", "Member of the debate team.", "International student.", "Needs accessibility accommodations."];

const generatedStudents: StudentData[] = [];
const usedNames = new Set(VALID_STUDENTS.map(s => s.name));

while (generatedStudents.length < 100) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    if (!usedNames.has(name)) {
        usedNames.add(name);
        generatedStudents.push({
            name,
            studentId: `STU-${Math.floor(10000000 + Math.random() * 90000000)}`,
            major: majors[Math.floor(Math.random() * majors.length)],
            enrollmentStatus: statuses[Math.floor(Math.random() * statuses.length)],
            securityNotes: notes[Math.floor(Math.random() * notes.length)],
        });
    }
}

export const ALL_STUDENTS: StudentData[] = [...VALID_STUDENTS, ...generatedStudents].sort((a, b) => a.name.localeCompare(b.name));
