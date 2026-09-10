import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Printer, 
  Folder, 
  ChevronRight, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  FileText, 
  ArrowLeft, 
  Check, 
  HelpCircle,
  Clock,
  Send,
  Edit3,
  ShieldCheck,
  Zap,
  Bookmark,
  RefreshCw,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, UserSubscription } from '../types';
import { fetchHomeworkRecords, HomeworkRecord, fetchExamRevisionQuestions, ExamQuestionRow, getNotebookDailyViewCount, incrementNotebookDailyViewCount, getExamPrepDailyAttemptCount, incrementExamPrepDailyAttemptCount } from '../services/supabaseService';

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}
export interface ExamTopic {
  id: string;
  name: string;
  nerdcUnit: string;
  objectives: string[];
  questions: ExamQuestion[];
}
export interface ExamSubject {
  id: string;
  name: string;
  icon: string;
  topics: ExamTopic[];
}
export interface ExamType {
  id: 'fslc' | 'bece' | 'waec';
  title: string;
  badge: string;
  levelTarget: string;
  description: string;
  subjects: ExamSubject[];
}

const EXAM_META: Omit<ExamType, 'subjects'>[] = [
  {
    id: 'fslc',
    title: 'First School Leaving Certificate',
    badge: 'Primary 6 / JS1 Entry',
    levelTarget: 'Primary 6',
    description: 'For Primary 6 learners preparing for Common Entrance & secondary school transition. Subjects appear here as they are verified against real official NERDC curriculum documents.'
  },
  {
    id: 'bece',
    title: 'Basic Education Certificate Exam',
    badge: 'JSS 3 / Junior WAEC',
    levelTarget: 'JSS 3',
    description: 'For JSS 3 students preparing for Junior WAEC and Senior Secondary placement. Subjects appear here as they are verified against real official NERDC curriculum documents.'
  },
  {
    id: 'waec',
    title: 'WAEC (SSCE) Senior Secondary',
    badge: 'SS3 / SSCE Exam',
    levelTarget: 'SS 3',
    description: 'For SS3 candidates preparing for the West African Senior School Certificate Examination. Subjects appear here as they are verified against real official NERDC curriculum documents.'
  }
];

function groupQuestionsIntoSubjects(rows: ExamQuestionRow[]): ExamSubject[] {
  const subjectMap = new Map<string, ExamSubject>();

  for (const row of rows) {
    if (!subjectMap.has(row.subjectId)) {
      subjectMap.set(row.subjectId, {
        id: row.subjectId,
        name: row.subjectName,
        icon: row.subjectIcon,
        topics: []
      });
    }
    const subject = subjectMap.get(row.subjectId)!;

    let topic = subject.topics.find(t => t.id === row.topicId);
    if (!topic) {
      topic = {
        id: row.topicId,
        name: row.topicName,
        nerdcUnit: row.nerdcUnit,
        objectives: row.objectives,
        questions: []
      };
      subject.topics.push(topic);
    }

    topic.questions.push({
      id: row.id,
      question: row.question,
      options: row.options,
      correctOptionIndex: row.correctOptionIndex,
      explanation: row.explanation
    });
  }

  return Array.from(subjectMap.values());
}

interface SmartStudyNotebookAndRevisionProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  userId: string;
  subscription?: UserSubscription;
  onOpenPricingModal: () => void;
}

function isPremiumActive(subscription?: UserSubscription): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active' && subscription.plan !== 'free') {
    return true;
  }
  if (subscription.status === 'trial' && subscription.expiresAt) {
    return new Date(subscription.expiresAt).getTime() > Date.now();
  }
  return false;
}

const COMING_SOON_SUBJECTS: Record<string, { name: string; icon: string }[]> = {
  fslc: [
    { name: 'Mathematics', icon: '📐' },
    { name: 'English Language', icon: '📖' },
    { name: 'Basic Science', icon: '🔬' },
    { name: 'Social Studies', icon: '🌍' },
    { name: 'Yoruba Language', icon: '🇳🇬' }
  ],
  bece: [
    { name: 'Basic Science & Technology', icon: '🔬' },
    { name: 'English Language', icon: '📖' },
    { name: 'Social Studies', icon: '🌍' },
    { name: 'Yoruba Language', icon: '🇳🇬' }
  ],
  waec: [
    { name: 'Mathematics (General)', icon: '📐' },
    { name: 'English Language', icon: '📖' },
    { name: 'Physics', icon: '⚛️' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Economics', icon: '💰' },
    { name: 'Government', icon: '🏛️' },
    { name: 'Yoruba Language', icon: '🇳🇬' }
  ]
};

const QUESTIONS_PER_ROUND = 8;
const FREE_DAILY_NOTEBOOK_VIEWS = 5;
const FREE_DAILY_EXAM_ATTEMPTS = 5;

// Derives which JSS grade(s) a topic's questions come from, based on
// its stored nerdcUnit text — e.g. "JSS1 Chapter 5" -> ['JSS1'],
// "BECE Chapter — Simple Equations (JSS1-3)" -> all three, since that
// topic deliberately blends questions from every JSS year. No separate
// database column needed; the grade info was already being stored,
// just not shown in the UI after the earlier chapter-label cleanup.
function getTopicGrades(nerdcUnit: string): string[] {
  const grades: string[] = [];
  if (/jss1-3|jss 1-3/i.test(nerdcUnit)) return ['JSS1', 'JSS2', 'JSS3'];
  if (/jss1/i.test(nerdcUnit)) grades.push('JSS1');
  if (/jss2/i.test(nerdcUnit)) grades.push('JSS2');
  if (/jss3/i.test(nerdcUnit)) grades.push('JSS3');
  return grades;
}

function pickRandomQuestions(pool: ExamQuestion[], count: number): ExamQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

interface StudySession {
  sessionId: string;
  subject: string | null;
  exchanges: HomeworkRecord[];
  resolved: boolean;
  latestDate: string;
}

function groupIntoSessions(records: HomeworkRecord[]): StudySession[] {
  const sessionMap = new Map<string, StudySession>();

  for (const record of records) {
    const key = record.sessionId || `single-${record.id}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        sessionId: key,
        subject: record.subject,
        exchanges: [],
        resolved: false,
        latestDate: record.createdAt
      });
    }
    const session = sessionMap.get(key)!;
    session.exchanges.push(record);
    session.latestDate = record.createdAt;
    if (record.wasCorrect) session.resolved = true;
  }

  return Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );
}

interface SubjectGroup {
  subject: string;
  sessions: StudySession[];
  latestDate: string;
}

function groupSessionsBySubject(sessions: StudySession[]): SubjectGroup[] {
  const subjectMap = new Map<string, SubjectGroup>();

  for (const session of sessions) {
    const key = session.subject || 'General';
    if (!subjectMap.has(key)) {
      subjectMap.set(key, { subject: key, sessions: [], latestDate: session.latestDate });
    }
    const group = subjectMap.get(key)!;
    group.sessions.push(session);
    if (new Date(session.latestDate) > new Date(group.latestDate)) {
      group.latestDate = session.latestDate;
    }
  }

  return Array.from(subjectMap.values()).sort(
    (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );
}

export const SmartStudyNotebookAndRevision: React.FC<SmartStudyNotebookAndRevisionProps> = ({
  profile,
  onProfileUpdate,
  userId,
  subscription,
  onOpenPricingModal
}) => {
  const isPremium = isPremiumActive(subscription);

  const [notebookViewCount, setNotebookViewCount] = useState<number>(
    () => getNotebookDailyViewCount().count
  );
  const notebookLimitReached = !isPremium && notebookViewCount >= FREE_DAILY_NOTEBOOK_VIEWS;

  const [examAttemptCount, setExamAttemptCount] = useState<number>(
    () => getExamPrepDailyAttemptCount().count
  );
  const examPrepLimitReached = !isPremium && examAttemptCount >= FREE_DAILY_EXAM_ATTEMPTS;

  const [activeView, setActiveView] = useState<'hub' | 'notebook' | 'revision'>('hub');
  
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ExamTopic | null>(null);
  // Lets a student narrow the topic list to a specific JSS grade, since
  // BECE genuinely covers JSS1-3 cumulatively and some topics (e.g.
  // Simple Equations) intentionally blend all three grades together.
  // Derived from each topic's stored nerdcUnit text rather than a
  // separate database column, since that value already encodes grade
  // info (e.g. "JSS1 Chapter 5", "BECE Chapter — X (JSS1-3)").
  const [gradeFilter, setGradeFilter] = useState<'all' | 'JSS1' | 'JSS2' | 'JSS3'>('all');
  
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [mode, setMode] = useState<'choose' | 'solve' | 'print'>('choose');

  const [displayedQuestions, setDisplayedQuestions] = useState<ExamQuestion[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  const [compiledNotes, setCompiledNotes] = useState<HomeworkRecord[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingNotes(true);
    fetchHomeworkRecords(userId, 50).then(records => {
      if (!cancelled) {
        setCompiledNotes(records);
        setIsLoadingNotes(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const studySessions = useMemo(() => groupIntoSessions(compiledNotes), [compiledNotes]);

  const subjectGroups = useMemo(() => groupSessionsBySubject(studySessions), [studySessions]);

  const [activeNotebookSubject, setActiveNotebookSubject] = useState<string | null>(null);
  React.useEffect(() => {
    if (subjectGroups.length === 0) {
      setActiveNotebookSubject(null);
      return;
    }
    if (!activeNotebookSubject || !subjectGroups.some(g => g.subject === activeNotebookSubject)) {
      setActiveNotebookSubject(subjectGroups[0].subject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectGroups]);

  const activeSubjectGroup = subjectGroups.find(g => g.subject === activeNotebookSubject) || null;

  const [examData, setExamData] = useState<ExamType[]>(
    EXAM_META.map(meta => ({ ...meta, subjects: [] }))
  );
  const [isLoadingExamData, setIsLoadingExamData] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingExamData(true);
    Promise.all(EXAM_META.map(meta => fetchExamRevisionQuestions(meta.id))).then(results => {
      if (cancelled) return;
      const combined = EXAM_META.map((meta, i) => ({
        ...meta,
        subjects: groupQuestionsIntoSubjects(results[i])
      }));
      setExamData(combined);
      setIsLoadingExamData(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSelectExam = (exam: ExamType) => {
    setSelectedExam(exam);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setSubmitted(false);
    setUserAnswers({});
    setMode('choose');
  };

  const handleSelectSubject = (subject: ExamSubject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setSubmitted(false);
    setUserAnswers({});
    setMode('choose');
    setGradeFilter('all');
  };

  const handleSelectTopic = (topic: ExamTopic) => {
    setSelectedTopic(topic);
    setSubmitted(false);
    setUserAnswers({});
    setMode('solve');
    setDisplayedQuestions(pickRandomQuestions(topic.questions, QUESTIONS_PER_ROUND));
    setRoundNumber(1);
  };

  const handleRefreshQuestions = () => {
    if (!selectedTopic) return;
    setSubmitted(false);
    setUserAnswers({});
    setDisplayedQuestions(pickRandomQuestions(selectedTopic.questions, QUESTIONS_PER_ROUND));
    setRoundNumber(r => r + 1);
  };

  const handleOptionSelect = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);

    if (!isPremium) {
      setExamAttemptCount(incrementExamPrepDailyAttemptCount());
    }

    let correctCount = 0;
    displayedQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    if (correctCount === displayedQuestions.length) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      onProfileUpdate({
        ...profile,
        stars: profile.stars + 30
      });
    }
  };

  const getScore = () => {
    let correct = 0;
    displayedQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });
    return { correct, total: displayedQuestions.length };
  };

  const comingSoonForExam = selectedExam ? (COMING_SOON_SUBJECTS[selectedExam.id] || []) : [];

  const totalTopics = studySessions.length;
  const totalCorrect = studySessions.filter(s => s.resolved).length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-28 font-sans">
      
      <div className="hidden print:block print:p-0 print:m-0 print:bg-white print:text-black">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-serif">
                FunlyLearn NERDC Study Document 🇳🇬
              </h1>
              <p className="text-sm font-sans text-slate-700">
                Student Name: <strong>{profile.name}</strong> · Class Level: <strong>{profile.classLevel}</strong>
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              Date: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {activeView === 'notebook' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-slate-900 border-b border-slate-300 pb-2">
              {profile.name}'s Study Notebook
            </h2>
            <p className="text-xs text-slate-600">
              {totalTopics} topics covered · {totalCorrect} correct answers
            </p>
            {subjectGroups.length === 0 ? (
              <p className="text-sm text-slate-600 italic">
                No homework sessions recorded yet. Chat with Mama Titi to build your notebook!
              </p>
            ) : (
              subjectGroups.map((group) => (
                <div key={group.subject} className="space-y-3">
                  <h3 className="text-base font-bold font-serif border-b border-slate-200 pb-1">
                    {group.subject}
                  </h3>
                  {group.sessions.map((session, i) => {
                    const firstExchange = session.exchanges[0];
                    return (
                      <div key={session.sessionId} className="p-4 border border-slate-300 rounded-lg space-y-2">
                        <div className="flex justify-between font-bold text-sm">
                          <span>Q: {firstExchange.topic}</span>
                          <span className="text-xs text-slate-500 shrink-0 ml-2">
                            {new Date(session.latestDate).toLocaleDateString()}
                          </span>
                        </div>
                        {firstExchange.mamaReply && (
                          <p className="text-xs text-slate-700 italic">
                            Mama Titi's Note: {firstExchange.mamaReply}
                          </p>
                        )}
                        <p className="text-xs text-slate-700 font-bold">
                          {session.resolved ? 'CORRECT ✅' : 'PRACTICING 💪'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        ) : selectedTopic ? (
          <div className="space-y-6">
            <div className="border border-slate-300 p-4 rounded-lg space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {selectedExam?.title} · {selectedSubject?.name}
              </span>
              <h2 className="text-xl font-serif font-bold text-slate-900">
                Topic: {selectedTopic.name}
              </h2>
            </div>

            <div className="p-4 border-2 border-slate-800 rounded-lg space-y-2">
              <h3 className="font-bold text-sm uppercase">🎯 Learning Objectives</h3>
              <ul className="list-disc list-inside text-xs text-slate-800 space-y-1">
                {selectedTopic.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-6 pt-2">
              <h3 className="font-bold text-base border-b border-slate-300 pb-2">
                Exam Revision Questions
              </h3>
              {displayedQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 border border-slate-300 rounded-lg space-y-3">
                  <p className="font-bold text-sm text-slate-900">
                    Question {idx + 1}: {q.question}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-800 font-mono">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-2 border border-slate-200 rounded">
                        [ ] {opt}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-200 text-xs text-slate-500">
                    Workspace / Answer Box: __________________________________________________
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
          Generated via FunlyLearn Companion
        </div>
      </div>

      <div className="print:hidden space-y-6">
        
        <div className="bg-[#064E3B] text-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {profile.isOutOfSchool ? 'Catch Up Scholar' : 'Student Scholar'}
                </span>
                <span className="text-xs text-emerald-200 whitespace-nowrap">NERDC Aligned</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white mt-0.5">
                {profile.name}
              </h1>
              <p className="text-xs text-emerald-200 font-sans">
                Class Level: <strong className="text-amber-300">{profile.classLevel}</strong> · {profile.language === 'yo' ? 'Yoruba & English' : 'English'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-300/30 text-xs font-jakarta font-bold flex items-center space-x-1.5">
                <span>⭐ {profile.stars} Stars</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <button
            onClick={() => {
              if (!isPremium) {
                setNotebookViewCount(incrementNotebookDailyViewCount());
              }
              setActiveView('notebook');
            }}
            className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden group shadow-soft ${
              activeView === 'notebook'
                ? 'bg-[#064E3B] text-white border-amber-400 shadow-xl'
                : 'bg-white hover:bg-amber-50/50 border-amber-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-jakarta font-bold text-[10px] uppercase">
                Personal Record
              </span>
            </div>

            <div className="mt-3 space-y-1">
              <h3 className={`font-serif text-lg font-bold ${activeView === 'notebook' ? 'text-white' : 'text-slate-900'}`}>
                Create Notebook
              </h3>
              <p className={`text-xs leading-relaxed ${activeView === 'notebook' ? 'text-emerald-100' : 'text-slate-600'}`}>
                Compiles everything you've learned from homework sessions with Mama Titi into a printable notebook.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between text-xs font-jakarta font-bold text-[#FF6B35]">
              <span>View & Print Notes</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => {
              setActiveView('revision');
              setSelectedExam(null);
              setSelectedSubject(null);
              setSelectedTopic(null);
            }}
            className={`p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden group shadow-soft ${
              activeView === 'revision'
                ? 'bg-[#064E3B] text-white border-emerald-400 shadow-xl'
                : 'bg-white hover:bg-emerald-50/50 border-emerald-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-200 group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6 text-[#064E3B]" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jakarta font-bold text-[10px] uppercase">
                NERDC Aligned
              </span>
            </div>

            <div className="mt-3 space-y-1">
              <h3 className={`font-serif text-lg font-bold ${activeView === 'revision' ? 'text-white' : 'text-slate-900'}`}>
                Exam Revision
              </h3>
              <p className={`text-xs leading-relaxed ${activeView === 'revision' ? 'text-emerald-100' : 'text-slate-600'}`}>
                Practice official Common Entrance (Primary 6), BECE (JSS 3), and WAEC (SS3) past exam questions with instant feedback.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center justify-between text-xs font-jakarta font-bold text-[#064E3B]">
              <span>Pick Exam Folder</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {activeView === 'notebook' && (
          <div className="rounded-3xl border-2 border-amber-300/80 shadow-xl overflow-hidden animate-fadeIn bg-amber-100">

            {subjectGroups.length > 1 && (
              <div className="flex items-end space-x-1 px-4 sm:px-6 pt-4 overflow-x-auto no-scrollbar">
                {subjectGroups.map((group) => (
                  <button
                    key={group.subject}
                    onClick={() => setActiveNotebookSubject(group.subject)}
                    className={`px-5 py-2.5 rounded-t-2xl text-xs sm:text-sm font-jakarta font-bold whitespace-nowrap transition-all relative ${
                      activeNotebookSubject === group.subject
                        ? 'bg-[#FFFBF5] text-[#064E3B] shadow-[0_-2px_6px_rgba(0,0,0,0.04)]'
                        : 'bg-amber-200/60 text-amber-900/60 hover:text-amber-900 -mb-0.5'
                    }`}
                  >
                    {group.subject}
                  </button>
                ))}
              </div>
            )}

            <div className="relative bg-[#FFFBF5] pl-8 pr-5 py-6 sm:pl-14 sm:pr-8 sm:py-8">

              <div className="absolute left-2.5 sm:left-5 top-0 bottom-0 w-3 flex flex-col justify-evenly py-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300/70 shadow-inner" />
                ))}
              </div>

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 35px, rgba(6,78,59,0.08) 35px, rgba(6,78,59,0.08) 36px)',
                  backgroundPosition: '0 90px'
                }}
              />
              <div className="absolute left-14 sm:left-24 top-0 bottom-0 w-px bg-rose-300/50 hidden sm:block" />

              <div className="relative space-y-6">

                <div className="flex items-start justify-between gap-4 flex-wrap border-b-2 border-slate-800/80 pb-5">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#064E3B]">
                      {profile.name}'s Study Notebook
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider border border-slate-300 text-slate-700 px-2.5 py-0.5 rounded-full bg-white">
                        {profile.classLevel}
                      </span>
                      <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider border border-amber-300 text-amber-800 px-2.5 py-0.5 rounded-full bg-white">
                        NERDC Aligned
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div>
                    <p className="font-serif text-2xl font-bold text-[#064E3B]">{totalTopics}</p>
                    <p className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-slate-500">
                      Topics Covered
                    </p>
                  </div>
                  <div>
                    <p className="font-serif text-2xl font-bold text-[#064E3B]">{totalCorrect}</p>
                    <p className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-slate-500">
                      Correct Answers
                    </p>
                  </div>
                </div>

                {isLoadingNotes ? (
                  <div className="py-10 text-center text-sm text-slate-500">Loading your sessions...</div>
                ) : notebookLimitReached ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border-2 border-amber-300 text-center space-y-3">
                    <span className="text-4xl block">📓</span>
                    <h3 className="font-serif text-lg font-bold text-[#064E3B]">
                      You've used today's {FREE_DAILY_NOTEBOOK_VIEWS} free notebook views
                    </h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Upgrade to Basic or Family for unlimited notebook access, plus printing and downloading {profile.name}'s full study notebook anytime.
                    </p>
                    <button
                      onClick={onOpenPricingModal}
                      className="px-5 py-2.5 rounded-2xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-md transition-all"
                    >
                      Upgrade for Unlimited Access
                    </button>
                  </div>
                ) : subjectGroups.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/70 border border-slate-200 text-center space-y-1">
                    <span className="text-3xl block">📚</span>
                    <p className="text-sm font-medium text-slate-600">No homework sessions yet</p>
                    <p className="text-xs text-slate-400">
                      Chat with Mama Titi about your homework to start building your notebook!
                    </p>
                  </div>
                ) : !activeSubjectGroup ? null : (
                  <div className="space-y-10 pt-2">
                    {activeSubjectGroup.sessions.map((session, idx) => {
                      const firstExchange = session.exchanges[0];
                      const laterExchanges = session.exchanges.slice(1);

                      return (
                        <div key={session.sessionId} className="relative space-y-3 pb-8 border-b-2 border-dashed border-slate-300 last:border-b-0">

                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(session.latestDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span
                              className={`shrink-0 -rotate-6 border-2 rounded-md px-3 py-1 text-[11px] font-jakarta font-extrabold tracking-wide uppercase bg-white/70 ${
                                session.resolved
                                  ? 'border-emerald-600 text-emerald-700'
                                  : 'border-amber-500 text-amber-700'
                              }`}
                            >
                              {session.resolved ? 'Correct ✅' : 'Practicing 💪'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-[#FF6B35]">
                              Question
                            </span>
                            <p className="font-jakarta font-bold text-sm sm:text-base text-slate-900">
                              {firstExchange.topic}
                            </p>
                          </div>

                          {firstExchange.mamaReply && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-amber-700">
                                Mama Titi's Guidance
                              </span>
                              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed italic pl-3 border-l-2 border-amber-300">
                                {firstExchange.mamaReply}
                              </p>
                            </div>
                          )}

                          {laterExchanges.length > 0 ? (
                            <div className="space-y-3 pt-1">
                              {laterExchanges.map((exchange, exIdx) => {
                                const isLast = exIdx === laterExchanges.length - 1;
                                return (
                                  <div key={exchange.id} className="space-y-1">
                                    <span className={`text-[10px] font-jakarta font-bold uppercase tracking-wider ${
                                      isLast && session.resolved ? 'text-emerald-700' : 'text-slate-400'
                                    }`}>
                                      {isLast ? `${profile.name}'s Final Answer` : `${profile.name}'s Answer (Attempt ${exIdx + 1})`}
                                    </span>
                                    <p className={
                                      isLast
                                        ? `p-3 rounded-xl border text-sm font-bold ${
                                            session.resolved
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                              : 'bg-white border-slate-200 text-slate-900'
                                          }`
                                        : 'text-xs text-slate-400 line-through decoration-slate-300 pl-1'
                                    }>
                                      {exchange.topic}
                                    </p>
                                    {isLast && exchange.mamaReply && (
                                      <p className="text-[11px] text-slate-600 italic pl-3 border-l-2 border-slate-200">
                                        {exchange.mamaReply}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic pt-1">
                              Waiting for {profile.name} to answer this one.
                            </p>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {activeView === 'revision' && (
          <div className="space-y-5 animate-fadeIn">
            
            <div className="flex items-center space-x-2 text-xs font-jakarta font-bold text-slate-600 bg-slate-100 p-3 rounded-2xl overflow-x-auto">
              <button
                onClick={() => {
                  setSelectedExam(null);
                  setSelectedSubject(null);
                  setSelectedTopic(null);
                }}
                className="hover:text-[#064E3B] flex items-center space-x-1 shrink-0"
              >
                <Folder className="w-3.5 h-3.5 text-[#064E3B]" />
                <span>Exams</span>
              </button>

              {selectedExam && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <button
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedTopic(null);
                    }}
                    className="hover:text-[#064E3B] shrink-0"
                  >
                    {selectedExam.title}
                  </button>
                </>
              )}

              {selectedSubject && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="hover:text-[#064E3B] shrink-0"
                  >
                    {selectedSubject.name}
                  </button>
                </>
              )}

              {selectedTopic && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[#064E3B] truncate">{selectedTopic.name}</span>
                </>
              )}
            </div>

            {!selectedExam && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="font-serif text-xl font-bold text-slate-900">
                    STEP 1 — Choose your exam
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select an official examination level to view relevant NERDC subjects and topics.
                  </p>
                </div>

                {isLoadingExamData ? (
                  <div className="py-10 text-center text-sm text-slate-500">Loading exam subjects...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {examData.map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => handleSelectExam(exam)}
                        className="p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-[#064E3B] shadow-soft hover:shadow-md transition-all text-left space-y-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-jakarta font-bold">
                            {exam.badge}
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#064E3B] group-hover:translate-x-1 transition-transform" />
                        </div>

                        <div>
                          <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-[#064E3B]">
                            {exam.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
                            {exam.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedExam && !selectedTopic && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between bg-[#064E3B] text-white p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-amber-300">
                      STEP 2 — Choose Subject & Topic
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white">{selectedExam.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedExam(null)}
                    className="text-xs font-jakarta font-bold text-amber-200 hover:underline"
                  >
                    Change Exam
                  </button>
                </div>

                {selectedExam.subjects.length === 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 leading-relaxed">
                    <strong>Rebuilding with verified curriculum:</strong> we removed all questions here to check each one against the real official Nigerian curriculum documents before bringing them back. Subjects below will unlock as they're verified.
                  </div>
                )}

                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {selectedExam.subjects.map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => handleSelectSubject(subj)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-jakarta font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                        selectedSubject?.id === subj.id
                          ? 'bg-[#FF6B35] text-white shadow-md'
                          : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base">{subj.icon}</span>
                      <span>{subj.name}</span>
                    </button>
                  ))}

                  {comingSoonForExam.map((subj) => (
                    <div
                      key={subj.name}
                      title={`${subj.name} — being verified against official curriculum`}
                      className="px-4 py-2.5 rounded-2xl text-xs font-jakarta font-bold whitespace-nowrap flex items-center space-x-2 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shrink-0"
                    >
                      <span className="text-base opacity-50">{subj.icon}</span>
                      <span>{subj.name}</span>
                      <span className="flex items-center space-x-0.5 text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Soon</span>
                      </span>
                    </div>
                  ))}
                </div>

                {selectedSubject ? (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                        <span>{selectedSubject.icon}</span>
                        <span>{selectedSubject.name} Topics</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {selectedSubject.topics.length} Topics
                      </span>
                    </div>

                    {/* JSS grade filter — lets a student narrow to just
                        their own year's topics, since BECE deliberately
                        covers JSS1-3 cumulatively and some topics blend
                        multiple grades together. */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {(['all', 'JSS1', 'JSS2', 'JSS3'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGradeFilter(g)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-jakarta font-bold whitespace-nowrap transition-all ${
                            gradeFilter === g
                              ? 'bg-[#064E3B] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {g === 'all' ? 'All Topics' : g}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {selectedSubject.topics
                        .filter((topic) => {
                          if (gradeFilter === 'all') return true;
                          return getTopicGrades(topic.nerdcUnit).includes(gradeFilter);
                        })
                        .map((topic, tIdx) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic)}
                          className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-left transition-all flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <h5 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#064E3B]">
                              {tIdx + 1}. {topic.name}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              {topic.questions.length} questions available
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#064E3B] group-hover:translate-x-1 transition-transform shrink-0" />
                        </button>
                      ))}
                      {selectedSubject.topics.filter((topic) =>
                        gradeFilter === 'all' ? true : getTopicGrades(topic.nerdcUnit).includes(gradeFilter)
                      ).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No {gradeFilter} topics in this subject yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                    <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-600 font-jakarta font-bold">
                      Tap a subject icon above to view topics.
                    </p>
                  </div>
                )}

              </div>
            )}

            {selectedExam && selectedTopic && examPrepLimitReached ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-soft text-center space-y-3">
                <span className="text-4xl block">🎓</span>
                <h3 className="font-serif text-lg font-bold text-[#064E3B]">
                  You've used today's {FREE_DAILY_EXAM_ATTEMPTS} free Exam Prep attempts
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Upgrade to Basic or Family for unlimited exam practice, plus printing and full notebook access anytime.
                </p>
                <button
                  onClick={onOpenPricingModal}
                  className="px-5 py-2.5 rounded-2xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-md transition-all"
                >
                  Upgrade for Unlimited Access
                </button>
              </div>
            ) : selectedExam && selectedTopic && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 shadow-soft space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {selectedExam.title}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      {selectedTopic.name}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setMode('solve')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-jakarta font-bold transition-all flex items-center space-x-1.5 ${
                        mode === 'solve'
                          ? 'bg-[#064E3B] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Solve here</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 rounded-2xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print this</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#022C22] text-white space-y-2 border border-amber-400/40 shadow-xs">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-serif font-bold text-xs uppercase tracking-wider">
                      Learning Objectives
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-100 leading-relaxed font-sans">
                    {selectedTopic.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      Practice Questions
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Set {roundNumber} · {displayedQuestions.length} of {selectedTopic.questions.length} total
                      </span>
                      {selectedTopic.questions.length > QUESTIONS_PER_ROUND && (
                        <button
                          onClick={handleRefreshQuestions}
                          className="px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-jakarta font-bold flex items-center space-x-1.5 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>New Questions</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {displayedQuestions.map((q, qIdx) => {
                    const isSelected = userAnswers[q.id] !== undefined;
                    const isCorrect = userAnswers[q.id] === q.correctOptionIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 transition-all ${
                          submitted
                            ? isCorrect
                              ? 'bg-emerald-50/80 border-emerald-400'
                              : 'bg-rose-50/80 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <p className="font-bold text-sm sm:text-base text-slate-900 font-jakarta">
                          Q{qIdx + 1}. {q.question}
                        </p>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const optionChosen = userAnswers[q.id] === oIdx;
                            const optionIsCorrect = oIdx === q.correctOptionIndex;

                            return (
                              <button
                                key={oIdx}
                                disabled={submitted}
                                onClick={() => handleOptionSelect(q.id, oIdx)}
                                className={`w-full p-3 rounded-xl border text-left text-xs font-jakarta font-medium transition-all flex items-center justify-between ${
                                  submitted
                                    ? optionIsCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                                      : optionChosen
                                      ? 'bg-rose-500 text-white border-rose-600 font-bold'
                                      : 'bg-white text-slate-500 border-slate-200'
                                    : optionChosen
                                    ? 'bg-[#064E3B] text-white border-[#064E3B] font-bold shadow-xs'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span>{opt}</span>
                                {submitted && optionIsCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                                )}
                                {submitted && optionChosen && !optionIsCorrect && (
                                  <XCircle className="w-4 h-4 text-white shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {submitted && (
                          <div className={`p-3 rounded-xl text-xs space-y-1 font-sans ${
                            isCorrect ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}>
                            <div className="flex items-center space-x-1.5 font-jakarta font-bold">
                              <span>Mama Titi Educator Feedback:</span>
                            </div>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!submitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userAnswers).length === 0}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] disabled:opacity-50 text-white font-jakarta font-bold text-sm shadow-md transition-all text-center flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>Check My Answers</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-serif font-bold text-base text-slate-900">
                          Score: {getScore().correct} / {getScore().total} Correct
                        </h4>
                        <p className="text-xs text-slate-600 font-sans">
                          {getScore().correct === getScore().total
                            ? '🎉 Perfect score! You earned +30 Stars!'
                            : 'Good effort! Review Mama Titi\'s feedback above and try again.'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-center">
                        {selectedTopic.questions.length > QUESTIONS_PER_ROUND && (
                          <button
                            onClick={handleRefreshQuestions}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>New Questions</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSubmitted(false);
                            setUserAnswers({});
                          }}
                          className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-jakarta font-bold shadow-xs"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
