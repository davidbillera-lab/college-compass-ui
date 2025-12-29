// Mock data for CollegeApp

export type UserRole = 'student' | 'parent' | 'counselor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profileStrength: number;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  description: string;
  years: string[];
  hoursPerWeek: number;
  verified: boolean;
  leadership?: string;
}

export interface Award {
  id: string;
  name: string;
  level: 'school' | 'regional' | 'state' | 'national' | 'international';
  year: string;
  verified: boolean;
}

export interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  fitScore: number;
  fitCategory: 'safety' | 'match' | 'reach';
  acceptanceRate: number;
  avgGPA: number;
  avgSAT?: number;
  majors: string[];
  tuition: number;
  imageUrl?: string;
  whyFits: string[];
  suggestedActions: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  amount: number;
  deadline: string;
  eligibility: number; // 0-100
  tags: string[];
  effort: 'low' | 'medium' | 'high';
  requirements: string[];
  url?: string;
}

export interface Essay {
  id: string;
  title: string;
  prompt: string;
  content: string;
  wordCount: number;
  lastUpdated: string;
  status: 'draft' | 'in-progress' | 'complete';
  versions: { id: string; content: string; date: string }[];
}

export interface VerificationItem {
  id: string;
  type: 'activity' | 'award' | 'counselor';
  name: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedDate?: string;
  verifiedDate?: string;
  verifier?: string;
}

// Mock current user
export const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  role: 'student',
  profileStrength: 72,
};

// Mock activities
export const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Debate Team Captain',
    category: 'Academic',
    description: 'Led varsity debate team to state championships',
    years: ['2022', '2023', '2024'],
    hoursPerWeek: 10,
    verified: true,
    leadership: 'Captain',
  },
  {
    id: '2',
    name: 'Community Food Bank Volunteer',
    category: 'Community Service',
    description: 'Weekly volunteer organizing food distributions',
    years: ['2021', '2022', '2023', '2024'],
    hoursPerWeek: 4,
    verified: false,
  },
  {
    id: '3',
    name: 'School Orchestra - First Violin',
    category: 'Arts',
    description: 'First chair violin in school symphony orchestra',
    years: ['2020', '2021', '2022', '2023', '2024'],
    hoursPerWeek: 8,
    verified: true,
    leadership: 'Section Leader',
  },
];

// Mock awards
export const mockAwards: Award[] = [
  { id: '1', name: 'National Merit Scholar Semifinalist', level: 'national', year: '2024', verified: true },
  { id: '2', name: 'State Debate Champion', level: 'state', year: '2023', verified: true },
  { id: '3', name: 'AP Scholar with Distinction', level: 'national', year: '2024', verified: false },
];

// Mock colleges
export const mockColleges: College[] = [
  {
    id: '1',
    name: 'Stanford University',
    location: 'Stanford, CA',
    type: 'Private',
    fitScore: 78,
    fitCategory: 'reach',
    acceptanceRate: 4,
    avgGPA: 3.96,
    avgSAT: 1530,
    majors: ['Computer Science', 'Economics', 'Political Science'],
    tuition: 56169,
    whyFits: ['Strong debate program matches your interests', 'Your leadership experience aligns with their values', 'Geographic preference match'],
    suggestedActions: ['Highlight debate achievements in essays', 'Connect with admissions rep at info session', 'Consider Early Action'],
  },
  {
    id: '2',
    name: 'University of Michigan',
    location: 'Ann Arbor, MI',
    type: 'Public',
    fitScore: 85,
    fitCategory: 'match',
    acceptanceRate: 20,
    avgGPA: 3.9,
    avgSAT: 1470,
    majors: ['Business', 'Engineering', 'Political Science'],
    tuition: 52266,
    whyFits: ['Strong match for your academic profile', 'Excellent debate and forensics programs', 'Good scholarship opportunities'],
    suggestedActions: ['Apply early for scholarship consideration', 'Reach out to debate coach', 'Visit campus if possible'],
  },
  {
    id: '3',
    name: 'University of Wisconsin-Madison',
    location: 'Madison, WI',
    type: 'Public',
    fitScore: 92,
    fitCategory: 'safety',
    acceptanceRate: 54,
    avgGPA: 3.85,
    avgSAT: 1410,
    majors: ['Political Science', 'Communication', 'Business'],
    tuition: 39427,
    whyFits: ['Strong academic match', 'Great value with merit scholarships', 'Vibrant campus community'],
    suggestedActions: ['Apply for Chancellors Scholarship', 'Connect with honors program', 'Review department-specific requirements'],
  },
];

// Mock scholarships
export const mockScholarships: Scholarship[] = [
  {
    id: '1',
    name: 'National Debate Scholarship',
    amount: 10000,
    deadline: '2025-02-15',
    eligibility: 95,
    tags: ['debate', 'leadership', 'academic'],
    effort: 'medium',
    requirements: ['500-word essay on civic discourse', 'Recommendation from debate coach', 'Competition results'],
  },
  {
    id: '2',
    name: 'Community Service Excellence Award',
    amount: 5000,
    deadline: '2025-01-30',
    eligibility: 88,
    tags: ['community service', 'need-based'],
    effort: 'low',
    requirements: ['Documentation of volunteer hours', 'Brief personal statement'],
  },
  {
    id: '3',
    name: 'Future Leaders Merit Scholarship',
    amount: 25000,
    deadline: '2025-03-01',
    eligibility: 75,
    tags: ['leadership', 'academic', 'merit'],
    effort: 'high',
    requirements: ['Full application with essays', 'Three recommendations', 'Interview round'],
  },
  {
    id: '4',
    name: 'Local Arts Foundation Grant',
    amount: 3000,
    deadline: '2025-01-15',
    eligibility: 90,
    tags: ['arts', 'music', 'local'],
    effort: 'low',
    requirements: ['Performance video submission', 'Short application form'],
  },
];

// Mock essays
export const mockEssays: Essay[] = [
  {
    id: '1',
    title: 'Common App Personal Statement',
    prompt: 'Share your story. What have you learned about yourself?',
    content: 'The moment I stepped up to the podium at nationals, I realized that debate had become more than just an activity...',
    wordCount: 487,
    lastUpdated: '2024-12-20',
    status: 'in-progress',
    versions: [
      { id: 'v1', content: 'First draft...', date: '2024-12-10' },
      { id: 'v2', content: 'The moment I stepped up...', date: '2024-12-20' },
    ],
  },
  {
    id: '2',
    title: 'Why Stanford Essay',
    prompt: 'Why Stanford? What about our community resonates with you?',
    content: '',
    wordCount: 0,
    lastUpdated: '2024-12-15',
    status: 'draft',
    versions: [],
  },
];

// Mock verification items
export const mockVerificationItems: VerificationItem[] = [
  { id: '1', type: 'activity', name: 'Debate Team Captain', status: 'verified', submittedDate: '2024-11-01', verifiedDate: '2024-11-15', verifier: 'Coach Martinez' },
  { id: '2', type: 'activity', name: 'Orchestra - First Violin', status: 'verified', submittedDate: '2024-11-05', verifiedDate: '2024-11-20', verifier: 'Mr. Thompson' },
  { id: '3', type: 'activity', name: 'Food Bank Volunteer', status: 'pending', submittedDate: '2024-12-01' },
  { id: '4', type: 'award', name: 'National Merit Semifinalist', status: 'verified', submittedDate: '2024-10-15', verifiedDate: '2024-10-20' },
  { id: '5', type: 'award', name: 'AP Scholar with Distinction', status: 'pending', submittedDate: '2024-12-10' },
  { id: '6', type: 'counselor', name: 'Counselor Final Sign-Off', status: 'pending' },
];

// Next best actions
export const mockNextActions = [
  { id: '1', title: 'Complete your Personal Story section', completed: false, priority: 'high' },
  { id: '2', title: 'Request verification for remaining activities', completed: false, priority: 'medium' },
  { id: '3', title: 'Add test scores if available', completed: false, priority: 'low' },
  { id: '4', title: 'Review scholarship deadline: Jan 15', completed: false, priority: 'high' },
  { id: '5', title: 'Update activities list', completed: true, priority: 'medium' },
];

// Profile steps
export const profileSteps = [
  { id: 'basics', title: 'Basics', description: 'Name, school, and graduation info' },
  { id: 'activities', title: 'Activities', description: 'Clubs, sports, and organizations' },
  { id: 'academics', title: 'Academics', description: 'Courses and test scores' },
  { id: 'honors', title: 'Honors & Awards', description: 'Recognition and achievements' },
  { id: 'portfolio', title: 'Portfolio', description: 'Work samples and media' },
  { id: 'story', title: 'Personal Story', description: 'Your unique narrative' },
];

// Student profile data
export const mockStudentProfile = {
  basics: {
    firstName: 'Alex',
    lastName: 'Johnson',
    school: 'Lincoln High School',
    graduationYear: '2025',
    gpa: 3.92,
    weightedGpa: 4.3,
    city: 'Portland',
    state: 'OR',
  },
  academics: {
    satScore: 1480,
    actScore: 33,
    apCourses: ['AP English Literature', 'AP US History', 'AP Calculus BC', 'AP Physics', 'AP Government'],
    honorsCourses: ['Honors Chemistry', 'Honors Spanish IV'],
  },
};
