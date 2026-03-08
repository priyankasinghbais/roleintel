import { GoogleGenAI, Type } from "@google/genai";
import { InterviewGuide, ResumeAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generateInterviewGuide(
  jobDescription: string, 
  resumeData?: { inlineData: { data: string, mimeType: string } } | string,
  role?: string,
  companyName?: string
): Promise<InterviewGuide> {
  const model = "gemini-3-flash-preview";
  
  const resumePart = typeof resumeData === 'string' 
    ? { text: `Candidate Resume Text:\n${resumeData}` }
    : resumeData;

  const contents: any[] = [
    {
      text: `
        Analyze the following job description and create a high-level, "insider" interview preparation guide.
        
        ${role ? `Target Role: ${role}` : ''}
        ${companyName ? `Target Company: ${companyName}` : ''}

        CRITICAL RESEARCH REQUIREMENTS:
        1. Company Intel: ${companyName ? `Focus specifically on ${companyName}.` : 'Do NOT just reframe the JD.'} Use your search tool to find the company's OFFICIAL website. Extract their real mission, core values, and current strategic focus. Look for "About Us", "Culture", or "Life at [Company]" pages.
           - IMPORTANT: Ensure all extracted text maintains proper spacing, punctuation, and capitalization. Do NOT concatenate words (e.g., "Tohelppeople" is wrong; "To help people" is correct).
        2. Employee Sentiment: Search Glassdoor, Reddit, and AmbitionBox for real candidate reports. Find specific interview patterns, common "gotcha" questions, and the actual culture vibe (e.g., "high-pressure but rewarding", "collaborative and slow-paced").
        3. Strategic Q&A: You MUST provide at least 4-6 questions per category (Behavioral, Technical, Role-Specific, Cultural). 
           - Extract REAL questions from Glassdoor, Reddit, Indeed, Naukri, and AmbitionBox for this specific company and role.
           - Add your own tailored questions based on the JD's specific requirements.
           - For each question, provide an "Insider Tip" explaining the hidden intent of the interviewer.
        
        The guide should be deeply tailored, not generic. 
        
        IMPORTANT: Do NOT include any citation numbers, indexes, or footnotes (e.g., [1], [1.1], [2.2]) in the generated text. The output should be clean and ready for display.
        
        Job Description:
        ${jobDescription}
        
        ${!resumeData ? "No resume provided." : "A resume is provided below. Perform a deep gap analysis comparing the candidate's experience to the JD requirements."}
      `
    }
  ];

  if (resumePart) {
    contents.push(resumePart);
  }

  const response = await withRetry(() => ai.models.generateContent({
    model: model,
    contents: { parts: contents },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      seed: 42,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          companyName: { type: Type.STRING },
          companyInsights: {
            type: Type.OBJECT,
            properties: {
              missionAndValues: { type: Type.ARRAY, items: { type: Type.STRING } },
              cultureVibe: { type: Type.STRING },
              recentNewsOrReviews: { type: Type.ARRAY, items: { type: Type.STRING } },
              interviewStyle: { type: Type.STRING },
            },
            required: ["missionAndValues", "cultureVibe", "recentNewsOrReviews", "interviewStyle"],
          },
          narrationStrategy: {
            type: Type.OBJECT,
            properties: {
              coreStory: { type: Type.STRING },
              keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
              elevatorPitch: { type: Type.STRING },
            },
            required: ["coreStory", "keyThemes", "elevatorPitch"],
          },
          keyRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          topSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["Behavioral", "Technical", "Role-Specific", "Cultural"] },
                suggestedAnswer: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                insiderTip: { type: Type.STRING },
              },
              required: ["question", "category", "suggestedAnswer", "keyPoints", "insiderTip"],
            },
          },
          preparationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          resumeAnalysis: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasToFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedAdditions: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedRemovals: { type: Type.ARRAY, items: { type: Type.STRING } },
              tailoringAdvice: { type: Type.STRING },
            },
            required: ["strengths", "weaknesses", "areasToFocus", "suggestedAdditions", "suggestedRemovals", "tailoringAdvice"],
          },
        },
        required: [
          "jobTitle",
          "companyInsights",
          "narrationStrategy",
          "keyRequirements",
          "topSkills",
          "interviewQuestions",
          "preparationTips",
          "checklist",
        ],
      },
    },
  }));

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate guide");
  }

  // Post-process to remove any citation numbers like [1], [1.1], [2.2] that might have slipped through
  const cleanedText = text.replace(/\s?\[\d+(?:\.\d+)*\]/g, '');

  return JSON.parse(cleanedText) as InterviewGuide;
}
