import { v4 as uuid } from "uuid";
import { StudentProfile } from "../types/student";
import { CollegeRecommendation } from "../types/college";
import { ScholarshipMatch } from "../types/scholarship";
import { WeeklyPlan } from "../types/task";

// -----------------------------
// Mock Student (for dev/demo)
// -----------------------------

export const mockStudentProfile: StudentProfile = {
  id: uuid(),
  createdAt: "2025-01-01",
  updatedAt: "2025-01-01",
  firstName: "Alex",
  lastName: "Johnson",
  graduationYear: 2026,
  location: { city: "Denver", state: "CO" },
  academics: {
    gpa: {
      value: 3.85,
      scale: 4,
      weighted: true,
      verificationStatus: "verified",
    },
    rigor: {
      honorsCount: 4,
      apCount: 5,
      verificationStatus: "verified",
    },
  },
  narrative: {
    tagline: "Service-driven leader with a passion for public policy",
    themes: ["leadership", "service", "advocacy"],
    bioShort:
      "Student leader focused on civic engagement, debate, and community service with long-term interest in law and public policy.",
  },
  preferences: {
    intendedMajors: ["Political Science", "Pre-Law"],
    regions: ["West", "Midwest"],
    schoolSize: "medium",
    setting: "urban",
  },
};

// -----------------------------
// Mock College Recommendations
// -----------------------------

export function getMockCollegeRecommendations(): CollegeRecommendation[] {
  return [
    {
      id: uuid(),
      collegeId: uuid(),
      collegeName: "University of Colorado Boulder",
      fitBand: "target",
      overallScore: 82,
      confidence: "high",
      reasons: [
        "Strong political science program",
        "Academic profile aligns with recent admits",
        "Regional preference match",
      ],
      risks: ["Highly competitive in-state applicant pool"],
      estimatedCost: {
        totalCostOfAttendance: 29000,
      },
      deadlines: {
        earlyAction: "2025-11-15",
        regularDecision: "2026-01-15",
      },
    },
    {
      id: uuid(),
      collegeId: uuid(),
      collegeName: "American University",
      fitBand: "reach",
      overallScore: 74,
      confidence: "medium",
      reasons: [
        "Excellent pre-law pipeline",
        "Strong service and advocacy alignment",
      ],
      risks: [
        "Lower acceptance rate",
        "High emphasis on demonstrated interest",
      ],
      estimatedCost: {
        totalCostOfAttendance: 62000,
      },
      deadlines: {
        earlyDecision: "2025-11-01",
        regularDecision: "2026-01-02",
      },
    },
    {
      id: uuid(),
      collegeId: uuid(),
      collegeName: "Colorado State University",
      fitBand: "likely",
      overallScore: 90,
      confidence: "high",
      reasons: [
        "Academic credentials exceed averages",
        "Strong regional and program fit",
      ],
      estimatedCost: {
        totalCostOfAttendance: 26000,
      },
      deadlines: {
        regularDecision: "2026-02-01",
      },
    },
  ];
}

// -----------------------------
// Mock Scholarship Matches
// -----------------------------

export function getMockScholarshipMatches(): ScholarshipMatch[] {
  return [
    {
      id: uuid(),
      scholarshipId: uuid(),
      scholarshipName: "Civic Leadership Scholars Award",
      eligibilityConfidence: "high",
      competitivenessEstimate: "medium",
      matchScore: 88,
      priority: "high",
      reasons: [
        "Strong alignment with service and leadership criteria",
        "Academic GPA exceeds minimum requirement",
      ],
      deadline: "2025-10-15",
      awardRange: {
        min: 2000,
        max: 5000,
      },
    },
    {
      id: uuid(),
      scholarshipId: uuid(),
      scholarshipName: "Future Public Servants Scholarship",
      eligibilityConfidence: "medium",
      competitivenessEstimate: "high",
      matchScore: 72,
      priority: "medium",
      reasons: [
        "Clear interest in public policy",
        "Competitive national applicant pool",
      ],
      deadline: "2025-12-01",
      awardRange: {
        min: 1000,
        max: 3000,
      },
    },
  ];
}

// -----------------------------
// Mock Weekly Plan
// -----------------------------

export function getMockWeeklyPlan(): WeeklyPlan {
  return {
    id: uuid(),
    weekOf: "2025-09-01",
    tasks: [
      {
        id: uuid(),
        type: "essay",
        title: "Draft Common App Personal Statement",
        description: "Focus on leadership and service narrative",
        dueDate: "2025-09-07",
        priority: "high",
        status: "todo",
      },
      {
        id: uuid(),
        type: "scholarship",
        title: "Apply: Civic Leadership Scholars Award",
        dueDate: "2025-10-15",
        priority: "high",
        status: "todo",
      },
      {
        id: uuid(),
        type: "college_app",
        title: "Finalize college shortlist",
        dueDate: "2025-09-10",
        priority: "medium",
        status: "in_progress",
      },
    ],
  };
}
