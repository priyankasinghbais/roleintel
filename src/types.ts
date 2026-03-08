export interface InterviewQuestion {
  question: string;
  category: 'Behavioral' | 'Technical' | 'Role-Specific' | 'Cultural';
  suggestedAnswer: string;
  keyPoints: string[];
  insiderTip?: string; // What they are REALLY looking for
}

export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  areasToFocus: string[];
  suggestedAdditions: string[];
  suggestedRemovals: string[];
  tailoringAdvice: string;
}

export interface InterviewGuide {
  jobTitle: string;
  companyName?: string;
  companyInsights: {
    missionAndValues: string[];
    cultureVibe: string;
    recentNewsOrReviews: string[];
    interviewStyle: string; // e.g., "Heavy on system design", "Values-based"
  };
  narrationStrategy: {
    coreStory: string; // How the candidate should position themselves
    keyThemes: string[];
    elevatorPitch: string;
  };
  keyRequirements: string[];
  topSkills: string[];
  interviewQuestions: InterviewQuestion[];
  preparationTips: string[];
  checklist: string[];
  resumeAnalysis?: ResumeAnalysis;
}
