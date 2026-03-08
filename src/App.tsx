import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardList, 
  FileText, 
  Lightbulb, 
  Loader2, 
  MessageSquare, 
  Search, 
  Sparkles,
  ArrowRight,
  Download,
  User,
  Target,
  ShieldAlert,
  Zap,
  BookOpen,
  Quote,
  Upload,
  X,
  File,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateInterviewGuide } from './services/gemini';
import { InterviewGuide, InterviewQuestion } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import mammoth from 'mammoth';

import { exportGuideToPDF } from './utils/pdfExport';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = 'overview' | 'questions' | 'resume' | 'company' | 'narration';

export default function App() {
  const [role, setRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      let resumeData: any = undefined;

      if (resumeFile) {
        const mimeType = resumeFile.type;
        
        if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
          const base64 = await readFileAsBase64(resumeFile);
          resumeData = { inlineData: { data: base64, mimeType } };
        } else if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          resumeFile.name.endsWith('.docx')
        ) {
          const arrayBuffer = await resumeFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          resumeData = result.value;
        } else if (mimeType === 'text/plain') {
          resumeData = await resumeFile.text();
        } else {
          // Fallback: try reading as text if unknown but small
          resumeData = await resumeFile.text();
        }
      }

      const result = await generateInterviewGuide(jobDescription, resumeData, role, companyName);
      setGuide(result);
      setActiveTab('overview');
    } catch (err) {
      console.error(err);
      setError('Failed to generate guide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (guide) {
      exportGuideToPDF(guide);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-mist text-ocean-deep font-sans selection:bg-ocean-light flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-ocean-light shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ocean-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-ocean-deep">RoleIntel</h1>
          </div>
          {guide && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportPDF}
                className="p-2 hover:bg-ocean-light rounded-full transition-colors text-ocean-primary print:hidden"
                title="Export as PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setGuide(null)}
                className="text-sm font-medium text-ocean-primary hover:text-ocean-deep px-3 py-1.5 rounded-full hover:bg-ocean-light transition-all print:hidden"
              >
                Back
              </button>
              <button 
                onClick={() => { setGuide(null); setJobDescription(''); setResumeFile(null); setRole(''); setCompanyName(''); }}
                className="text-sm font-medium text-success-teal hover:text-ocean-deep px-3 py-1.5 rounded-full hover:bg-ocean-light transition-all print:hidden"
              >
                New
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 pb-24">
          <AnimatePresence mode="wait">
          {!guide ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-4 text-ocean-deep">
                  Turn any job description into an interview strategy.
                </h2>
                <p className="text-ocean-primary text-lg max-w-2xl mx-auto">
                  Analyze the role, align your experience, and prepare for the interview with confidence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-ocean-light p-6">
                  <label htmlFor="jd" className="block text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-ocean-primary" />
                    Job Description
                  </label>
                  <textarea
                    id="jd"
                    rows={10}
                    className="w-full p-4 bg-ocean-mist border border-ocean-light rounded-xl focus:ring-2 focus:ring-ocean-accent focus:border-transparent transition-all resize-none text-sm leading-relaxed outline-none"
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-ocean-light p-6">
                  <label className="block text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-success-teal" />
                    Your Resume (PDF, DOCX, Image)
                  </label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setResumeFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={cn(
                      "w-full h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                      resumeFile 
                        ? "border-success-teal bg-success-teal/5" 
                        : "border-ocean-light hover:border-ocean-primary hover:bg-ocean-mist"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                    />
                    
                    {resumeFile ? (
                      <div className="flex flex-col items-center gap-3 p-4 text-center">
                        <div className="w-12 h-12 bg-ocean-light rounded-full flex items-center justify-center">
                          <File className="w-6 h-6 text-success-teal" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-ocean-deep truncate max-w-[200px]">
                            {resumeFile.name}
                          </p>
                          <p className="text-xs text-ocean-primary">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setResumeFile(null);
                          }}
                          className="mt-2 flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-4 text-center">
                        <div className="w-12 h-12 bg-ocean-mist rounded-full flex items-center justify-center group-hover:bg-ocean-light transition-colors">
                          <Upload className="w-6 h-6 text-ocean-primary group-hover:text-success-teal" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-ocean-deep">
                            Click or drag to upload CV
                          </p>
                          <p className="text-xs text-ocean-primary">
                            Supports PDF, DOCX, and Images
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-ocean-light p-6 mb-8">
                <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Skip this section if the job description already mentions the role and company name.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-ocean-primary" />
                      Target Role
                    </label>
                    <input
                      id="role"
                      type="text"
                      className="w-full p-4 bg-ocean-mist border border-ocean-light rounded-xl focus:ring-2 focus:ring-ocean-accent focus:border-transparent transition-all text-sm outline-none"
                      placeholder="e.g. Senior Product Designer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4 text-ocean-primary" />
                      Company Name
                    </label>
                    <input
                      id="company"
                      type="text"
                      className="w-full p-4 bg-ocean-mist border border-ocean-light rounded-xl focus:ring-2 focus:ring-ocean-accent focus:border-transparent transition-all text-sm outline-none"
                      placeholder="e.g. Google"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !jobDescription.trim() || !resumeFile}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
                    (loading || !jobDescription.trim() || !resumeFile)
                      ? "bg-ocean-light text-ocean-primary/50 cursor-not-allowed shadow-none" 
                      : "bg-ocean-primary text-white hover:bg-ocean-deep active:scale-[0.98] shadow-ocean-primary/20"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Performing Deep Analysis...
                    </>
                  ) : (
                    <>
                      Generate Insider Guide
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {(!jobDescription.trim() || !resumeFile) && !loading && (
                  <p className="mt-4 text-center text-xs text-ocean-primary flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Role and Company help refine the strategy. JD and Resume are required.
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6 print:block"
            >
              {/* Guide Header */}
              <div className="bg-white rounded-2xl p-8 border border-ocean-light shadow-sm print:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-ocean-light text-ocean-primary rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                      <Zap className="w-3 h-3" />
                      Insider Prep Strategy
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ocean-deep">
                      {guide.jobTitle}
                    </h2>
                    {guide.companyName && (
                      <p className="text-xl text-ocean-primary mt-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        {guide.companyName}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block p-4 bg-ocean-mist rounded-2xl border border-ocean-light max-w-xs">
                    <p className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-2">Vibe Check</p>
                    <p className="text-sm text-ocean-deep italic">"{guide.companyInsights.cultureVibe}"</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex p-1 bg-ocean-light/30 rounded-xl w-fit overflow-x-auto max-w-full print:hidden">
                <TabButton 
                  active={activeTab === 'overview'} 
                  onClick={() => setActiveTab('overview')}
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Overview"
                />
                <TabButton 
                  active={activeTab === 'narration'} 
                  onClick={() => setActiveTab('narration')}
                  icon={<Quote className="w-4 h-4" />}
                  label="Narration"
                />
                <TabButton 
                  active={activeTab === 'questions'} 
                  onClick={() => setActiveTab('questions')}
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Q&A"
                />
                {guide.resumeAnalysis && (
                  <TabButton 
                    active={activeTab === 'resume'} 
                    onClick={() => setActiveTab('resume')}
                    icon={<User className="w-4 h-4" />}
                    label="Resume Audit"
                  />
                )}
                <TabButton 
                  active={activeTab === 'company'} 
                  onClick={() => setActiveTab('company')}
                  icon={<Search className="w-4 h-4" />}
                  label="Company Intel"
                />
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px] print:min-h-0 print:space-y-12">
                {/* Overview Section */}
                <div className={cn(activeTab !== 'overview' && "hidden print:block")}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
                    <Section title="The Core Requirements" icon={<Target className="text-ocean-primary" />}>
                      <ul className="space-y-4">
                        {guide.keyRequirements.map((req, i) => (
                          <li key={i} className="flex gap-3 text-sm text-ocean-deep/80 leading-relaxed">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-success-teal shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </Section>
                    <div className="space-y-6">
                      <Section title="Top Skills to Highlight" icon={<Zap className="text-success-teal" />}>
                        <div className="flex flex-wrap gap-2">
                          {guide.topSkills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-ocean-light text-ocean-primary rounded-lg text-xs font-bold border border-ocean-light">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Section>
                      <Section title="Final Checklist" icon={<CheckCircle2 className="text-success-teal" />}>
                        <ul className="space-y-3">
                          {guide.checklist.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-ocean-deep/80">
                              <div className="w-5 h-5 rounded border border-ocean-light flex items-center justify-center shrink-0">
                                <div className="w-3 h-3 rounded-sm bg-ocean-mist" />
                              </div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Section>
                    </div>
                  </motion.div>
                </div>

                {/* Narration Section */}
                <div className={cn(activeTab !== 'narration' && "hidden print:block")}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <Section title="Your Interview Narration" icon={<Quote className="text-ocean-primary" />}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                          <div>
                            <h4 className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-3">The Core Story</h4>
                            <p className="text-lg text-ocean-deep leading-relaxed font-medium">
                              {guide.narrationStrategy.coreStory}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-3">Key Themes to Weave In</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {guide.narrationStrategy.keyThemes.map((theme, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-ocean-mist rounded-xl border border-ocean-light text-sm text-ocean-deep">
                                  <ChevronRight className="w-4 h-4 text-success-teal" />
                                  {theme}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="bg-ocean-primary rounded-2xl p-6 text-white shadow-xl shadow-ocean-primary/20">
                          <h4 className="text-xs font-bold text-ocean-light uppercase tracking-widest mb-4">The Elevator Pitch</h4>
                          <p className="text-sm leading-relaxed italic opacity-90">
                            "{guide.narrationStrategy.elevatorPitch}"
                          </p>
                          <div className="mt-6 pt-6 border-t border-ocean-light/30 flex items-center gap-2 text-xs text-ocean-light">
                            <Lightbulb className="w-4 h-4" />
                            Practice this until it's natural.
                          </div>
                        </div>
                      </div>
                    </Section>
                  </motion.div>
                </div>

                {/* Questions Section */}
                <div className={cn(activeTab !== 'questions' && "hidden print:block")}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {['Behavioral', 'Technical', 'Role-Specific', 'Cultural'].map(category => {
                      const questions = guide.interviewQuestions.filter(q => q.category === category);
                      if (questions.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                            <div className={cn(
                              "w-2 h-6 rounded-full",
                              category === 'Behavioral' && "bg-ocean-primary",
                              category === 'Technical' && "bg-success-teal",
                              category === 'Role-Specific' && "bg-ocean-deep",
                              category === 'Cultural' && "bg-ocean-accent",
                            )} />
                            <h3 className="text-xl font-bold text-ocean-deep">{category} Questions</h3>
                            <span className="text-xs font-bold text-ocean-primary bg-ocean-light px-2 py-0.5 rounded-full">
                              {questions.length}
                            </span>
                          </div>
                          <div className="space-y-4">
                            {questions.map((q, i) => (
                              <QuestionCard key={i} question={q} index={i} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Resume Audit Section */}
                {guide.resumeAnalysis && (
                  <div className={cn(activeTab !== 'resume' && "hidden print:block")}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <Section title="Resume Gap Analysis" icon={<User className="text-success-teal" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-bold text-success-teal mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Your Strengths for this Role
                              </h4>
                              <ul className="space-y-2">
                                {guide.resumeAnalysis.strengths.map((s, i) => (
                                  <li key={i} className="text-sm text-ocean-deep/80 flex gap-2">
                                    <span className="text-success-teal">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-ocean-primary mb-3 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" />
                                Potential Weaknesses / Gaps
                              </h4>
                              <ul className="space-y-2">
                                {guide.resumeAnalysis.weaknesses.map((w, i) => (
                                  <li key={i} className="text-sm text-ocean-deep/80 flex gap-2">
                                    <span className="text-ocean-primary">•</span> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="bg-ocean-mist rounded-2xl p-6 border border-ocean-light">
                            <h4 className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-4">Tailoring Strategy</h4>
                            <p className="text-sm text-ocean-deep/80 leading-relaxed mb-6">
                              {guide.resumeAnalysis.tailoringAdvice}
                            </p>
                            <div className="space-y-4">
                              <div>
                                <h5 className="text-xs font-bold text-ocean-deep mb-2">What to Add/Frame</h5>
                                <div className="flex flex-wrap gap-2">
                                  {guide.resumeAnalysis.suggestedAdditions.map((a, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-ocean-light rounded text-[10px] text-ocean-deep/70">
                                      + {a}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-ocean-deep mb-2">What to Skip/Minimize</h5>
                                <div className="flex flex-wrap gap-2">
                                  {guide.resumeAnalysis.suggestedRemovals.map((r, i) => (
                                    <span key={i} className="px-2 py-1 bg-ocean-light/50 rounded text-[10px] text-ocean-primary/40 line-through">
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Section>
                    </motion.div>
                  </div>
                )}

                {/* Company Intel Section */}
                <div className={cn(activeTab !== 'company' && "hidden print:block")}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-1">
                    <div className="md:col-span-2 space-y-6">
                      <Section title="Mission & Values" icon={<BookOpen className="text-ocean-primary" />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {guide.companyInsights.missionAndValues.map((val, i) => (
                            <div key={i} className="p-4 bg-ocean-light/30 border border-ocean-light rounded-xl text-sm text-ocean-deep">
                              {val}
                            </div>
                          ))}
                        </div>
                      </Section>
                      <Section title="The Interview Style" icon={<Target className="text-success-teal" />}>
                        <p className="text-sm text-ocean-deep/80 leading-relaxed">
                          {guide.companyInsights.interviewStyle}
                        </p>
                      </Section>
                    </div>
                    <Section title="Recent Intel & Reviews" icon={<Search className="text-ocean-primary" />}>
                      <ul className="space-y-4">
                        {guide.companyInsights.recentNewsOrReviews.map((news, i) => (
                          <li key={i} className="text-sm text-ocean-deep/80 leading-relaxed flex gap-3">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ocean-light shrink-0" />
                            {news}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>

      <footer className="w-full border-t border-ocean-light bg-white py-12 shrink-0 print:hidden mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-ocean-primary/50 text-sm">
          <p>© 2026 RoleIntel powered by Gemini 3.1 Pro. Built for the modern candidate.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-8 border border-ocean-light shadow-sm transition-all hover:shadow-md h-auto print:shadow-none print:border-none print:p-0">
      <div className="flex items-center gap-3 mb-6 print:mb-4">
        {icon}
        <h3 className="text-lg font-bold tracking-tight text-ocean-deep">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function QuestionCard({ question, index }: { question: InterviewQuestion, index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="border border-ocean-light rounded-xl overflow-hidden transition-all hover:border-ocean-primary print:border-ocean-light print:mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left flex items-start justify-between gap-4 bg-ocean-mist/30 hover:bg-ocean-mist transition-colors print:bg-transparent"
      >
        <div className="space-y-2">
          <h4 className="font-bold text-ocean-deep leading-snug break-words text-lg">
            {question.question}
          </h4>
        </div>
        <ChevronRight className={cn("w-5 h-5 text-ocean-primary/50 transition-transform shrink-0 mt-1 print:hidden", expanded && "rotate-90")} />
      </button>
      
      {(expanded || typeof window === 'undefined') && (
        <div className="p-6 bg-white space-y-6 print:block border-t border-ocean-light">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-3">Answer Strategy</h5>
              <p className="text-sm text-ocean-deep/80 leading-relaxed italic whitespace-pre-wrap">
                "{question.suggestedAnswer}"
              </p>
            </div>
            <div className="bg-ocean-light/30 p-4 rounded-xl border border-ocean-light">
              <h5 className="text-xs font-bold text-ocean-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Insider Tip: What they're testing
              </h5>
              <p className="text-sm text-ocean-deep font-medium leading-relaxed">
                {question.insiderTip}
              </p>
            </div>
          </div>
          <div>
            <h5 className="text-xs font-bold text-ocean-primary/50 uppercase tracking-widest mb-3">Key Points to Hit</h5>
            <div className="flex flex-wrap gap-2">
              {question.keyPoints.map((point, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-ocean-light text-ocean-deep/70 rounded-lg text-xs font-medium">
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
        active 
          ? "bg-white text-ocean-primary shadow-sm" 
          : "text-ocean-primary/60 hover:text-ocean-deep hover:bg-ocean-light/50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
