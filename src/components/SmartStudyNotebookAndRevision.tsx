import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Printer, 
  Download, 
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
import { MamaTitiAvatar } from './MamaTitiAvatar';
import { fetchHomeworkRecords, HomeworkRecord, fetchExamRevisionQuestions, ExamQuestionRow, getNotebookDailyViewCount, incrementNotebookDailyViewCount, getExamPrepDailyAttemptCount, incrementExamPrepDailyAttemptCount } from '../services/supabaseService';

// Local types replacing the ones previously imported from the static
// examRevisionData.ts file, now built at runtime from live Supabase rows.
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

// Stable structural metadata only — no actual questions/subjects here.
// Real content is fetched live from Supabase and grouped in at runtime.
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

// Groups flat rows fetched from Supabase into the nested
// Subject -> Topic -> Question structure the UI renders.
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

// Same premium check as ChatPage.tsx — active paid plan, or a still-valid
// trial period. Smart Notebook viewing/export is Basic/Family only; the
// underlying homework records still accumulate for free either way, so
// by the time a parent upgrades there's already real progress to see.
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

// Subjects that are planned but don't have real question content yet.
// Shown as disabled "Coming Soon" buttons so the gap is honest instead
// of just silently missing from the list. ALL subjects are here right
// now, including previously-live ones, since every subject was pulled
// pending individual verification against real fetched NERDC documents.
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

// How many questions to show per round — the rest of the topic's real
// question pool stays available for the next "New Questions" refresh.
const QUESTIONS_PER_ROUND = 8;

// Free users get this many notebook views per day before being
// prompted to upgrade — same rhythm as chat's 5 free daily messages,
// rather than the notebook being fully locked from the very first
// visit.
const FREE_DAILY_NOTEBOOK_VIEWS = 5;

// Same limit, separate constant for clarity - free users get this
// many Exam Prep quiz attempts per day before being prompted to
// upgrade, matching the same rhythm as chat and the notebook.
const FREE_DAILY_EXAM_ATTEMPTS = 5;

function pickRandomQuestions(pool: ExamQuestion[], count: number): ExamQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

// A real study session: one or more exchanges on the same topic,
// grouped together by session_id, from the first attempt through to
// the child finally getting it right (or the most recent attempt, if
// still unresolved). Records without a session_id (older data, or
// subjects not yet covered by session grouping) each become their own
// single-exchange session, so nothing from before this feature existed
// disappears from the notebook.
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

  // Most recent session first, matching how the notebook displayed
  // records before this change.
  return Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );
}

// One card per subject, not per topic — every session (topic) for
// that subject nests inside it, so the notebook stays compact instead
// of growing a new top-level card for every single topic ever asked
// about. Sessions without a recognized subject group under "General."
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

  // Free notebook view tracking — resets daily, same rhythm as chat's
  // message limit. Only relevant for non-premium users; premium users
  // always have full access regardless of this count.
  const [notebookViewCount, setNotebookViewCount] = useState<number>(
    () => getNotebookDailyViewCount().count
  );
  const notebookLimitReached = !isPremium && notebookViewCount >= FREE_DAILY_NOTEBOOK_VIEWS;

  // Free exam prep attempt tracking — same daily rhythm again. Each
  // quiz submission (Check My Answers) counts as one attempt.
  const [examAttemptCount, setExamAttemptCount] = useState<number>(
    () => getExamPrepDailyAttemptCount().count
  );
  const examPrepLimitReached = !isPremium && examAttemptCount >= FREE_DAILY_EXAM_ATTEMPTS;

  // Navigation & View States
  const [activeView, setActiveView] = useState<'hub' | 'notebook' | 'revision'>('hub');
  
  // Revision Flow States (Max 4 Taps Deep: Exam -> Subject -> Topic -> Questions)
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExamSubject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ExamTopic | null>(null);
  
  // Interactive "Solve Here" Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [mode, setMode] = useState<'choose' | 'solve' | 'print'>('choose');

  // The current round of questions being shown, refreshable to pull a
  // different random subset from the topic's full question pool.
  const [displayedQuestions, setDisplayedQuestions] = useState<ExamQuestion[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);

  // Real homework sessions from Supabase, replacing the previous
  // hardcoded mock notebook entries.
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

  // Groups the flat records into real study sessions — currently only
  // Math gets true multi-exchange grouping (see ChatPage.tsx), other
  // subjects each become their own single-exchange session so nothing
  // is hidden while this feature expands to more subjects over time.
  const studySessions = useMemo(() => groupIntoSessions(compiledNotes), [compiledNotes]);

  // Then grouped again by subject — one notebook "chapter" per subject,
  // all its sessions nested inside, matching the Stitch mockup's
  // Mathematics / Science tab layout.
  const subjectGroups = useMemo(() => groupSessionsBySubject(studySessions), [studySessions]);

  // Which subject TAB is active in the notebook view (Stitch-style
  // "Mathematics | Science" tabs, replacing the old accordion cards).
  // Defaults to the first subject once data loads; reset whenever the
  // set of subjects actually changes (e.g. a brand-new subject arrives).
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

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Live exam data — real questions fetched from Supabase per exam type,
  // combined with stable structural metadata, instead of a bundled file.
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

  // Action: Print Personal Notebook or Exam Revision
  const handlePrint = () => {
    window.print();
  };

  // Action: Download Personal Notebook
  const handleDownloadNotebook = (subjectFilter?: string) => {
    const groupsToInclude = subjectFilter
      ? subjectGroups.filter(g => g.subject === subjectFilter)
      : subjectGroups;

    let content = `========================================================\n`;
    content += `          FUNLYLEARN SMART STUDY NOTEBOOK             \n`;
    content += `========================================================\n\n`;
    content += `Student Name: ${profile.name}\n`;
    content += `Class Level: ${profile.classLevel}\n`;
    content += `Curriculum: Official Nigerian NERDC\n`;
    content += `Date Compiled: ${new Date().toLocaleDateString()}\n\n`;

    groupsToInclude.forEach((group) => {
      content += `========================================================\n`;
      content += `${group.subject.toUpperCase()}\n`;
      content += `========================================================\n\n`;

      group.sessions.forEach((session, idx) => {
        const firstExchange = session.exchanges[0];
        content += `--------------------------------------------------------\n`;
        content += `${idx + 1}. ${firstExchange.topic}\n`;
        content += `Date: ${new Date(session.latestDate).toLocaleDateString()}\n`;
        content += `Result: ${session.resolved ? 'Answered correctly' : 'Still practicing'}\n\n`;

        session.exchanges.forEach((exchange, exIdx) => {
          const label =
            exIdx === session.exchanges.length - 1 && session.resolved
              ? 'Final answer'
              : `Attempt ${exIdx + 1}`;
          content += `  [${label}]\n`;
          content += `  ${profile.name} asked: ${exchange.topic}\n`;
          if (exchange.mamaReply) {
            content += `  Mama Titi explained: ${exchange.mamaReply}\n`;
          }
          content += `\n`;
        });
      });
      content += `\n`;
    });

    content += `Generated via FunlyLearn AI Companion (NERDC Aligned)\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = subjectFilter
      ? `${profile.name}_${subjectFilter}_Study_Notes.txt`
      : `${profile.name}_Smart_Study_Notebook.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  // Select Exam
  const handleSelectExam = (exam: ExamType) => {
    setSelectedExam(exam);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setSubmitted(false);
    setUserAnswers({});
    setMode('choose');
  };

  // Select Subject
  const handleSelectSubject = (subject: ExamSubject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setSubmitted(false);
    setUserAnswers({});
    setMode('choose');
  };

  // Select Topic — pulls the first random round of questions
  const handleSelectTopic = (topic: ExamTopic) => {
    setSelectedTopic(topic);
    setSubmitted(false);
    setUserAnswers({});
    setMode('solve');
    setDisplayedQuestions(pickRandomQuestions(topic.questions, QUESTIONS_PER_ROUND));
    setRoundNumber(1);
  };

  // Refresh — pulls a new random round from the same topic's full pool
  const handleRefreshQuestions = () => {
    if (!selectedTopic) return;
    setSubmitted(false);
    setUserAnswers({});
    setDisplayedQuestions(pickRandomQuestions(selectedTopic.questions, QUESTIONS_PER_ROUND));
    setRoundNumber(r => r + 1);
  };

  // Select Quiz Answer Option
  const handleOptionSelect = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  // Submit Interactive Quiz
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

  // Calculate score
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

  // Total topics + total correct across ALL subjects, for the cover
  // page stat line (Stitch mockup's "12 TOPICS COVERED / 9 CORRECT
  // ANSWERS"), not just the active tab's subject.
  const totalTopics = studySessions.length;
  const totalCorrect = studySessions.filter(s => s.resolved).length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-28 font-sans">
      
      {/* Printable Sheet Header (Only visible during printing) */}
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

        {/* Print Content for Notebook or Revision */}
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
              <p className="text-xs text-slate-600">Unit: {selectedTopic.nerdcUnit}</p>
            </div>

            <div className="p-4 border-2 border-slate-800 rounded-lg space-y-2">
              <h3 className="font-bold text-sm uppercase">🎯 Official Learning Objectives</h3>
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
          Generated via FunlyLearn Companion · Grounded in official Nigerian NERDC Curriculum
        </div>
      </div>

      {/* Screen Content (Hidden when printing) */}
      <div className="print:hidden space-y-6">
        
        {/* Top Profile Header Bar */}
        <div className="bg-[#064E3B] text-white p-5 sm:p-6 rounded-3xl border-2 border-amber-400/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3.5">
              <MamaTitiAvatar size="md" showOnlineStatus={false} />
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
            </div>

            <div className="text-right shrink-0">
              <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-300/30 text-xs font-jakarta font-bold flex items-center space-x-1.5">
                <span>⭐ {profile.stars} Stars</span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO CLEAR ENTRY POINTS AT TOP OF SCREEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* ENTRY POINT A: "Create Notebook" Button / Card */}
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

          {/* ENTRY POINT B: Exam Revision Folder Card */}
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

            {/* Subject Tabs — folder-style tabs that visually attach to
                the page below, like real notebook chapter dividers. */}
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

            {/* The "page" itself — ruled paper texture + spiral
                binding holes down the left edge, like a real
                notebook page. */}
            <div className="relative bg-[#FFFBF5] pl-8 pr-5 py-6 sm:pl-14 sm:pr-8 sm:py-8">

              {/* Spiral binding holes */}
              <div className="absolute left-2.5 sm:left-5 top-0 bottom-0 w-3 flex flex-col justify-evenly py-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300/70 shadow-inner" />
                ))}
              </div>

              {/* Ruled lines background */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 35px, rgba(6,78,59,0.08) 35px, rgba(6,78,59,0.08) 36px)',
                  backgroundPosition: '0 90px'
                }}
              />
              {/* Left margin rule, like a school exercise book */}
              <div className="absolute left-14 sm:left-24 top-0 bottom-0 w-px bg-rose-300/50 hidden sm:block" />

              <div className="relative space-y-6">

                {/* Cover / header block */}
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

                {/* Stat line */}
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

                {/* Action Buttons: Print & Download — Basic/Family only */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={isPremium ? handlePrint : onOpenPricingModal}
                    className="px-3.5 py-2 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={isPremium ? () => setShowDownloadMenu(prev => !prev) : onOpenPricingModal}
                      className="px-3.5 py-2 rounded-2xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    {showDownloadMenu && (
                      <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-1.5 overflow-hidden">
                        <button
                          onClick={() => handleDownloadNotebook()}
                          className="w-full text-left px-4 py-2.5 text-xs font-jakarta font-bold text-slate-800 hover:bg-slate-50"
                        >
                          All Subjects
                        </button>
                        {subjectGroups.map(group => (
                          <button
                            key={group.subject}
                            onClick={() => handleDownloadNotebook(group.subject)}
                            className="w-full text-left px-4 py-2.5 text-xs font-jakarta font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {group.subject} only
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notebook entries — real homework sessions from
                    Supabase, for the active subject tab only. Free
                    users get real access up to FREE_DAILY_NOTEBOOK_VIEWS
                    views per day, then see this upgrade prompt. */}
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

                          {/* Date + rotated stamp badge, like real ink stamps */}
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

                          {/* QUESTION */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-[#FF6B35]">
                              Question
                            </span>
                            <p className="font-jakarta font-bold text-sm sm:text-base text-slate-900">
                              {firstExchange.topic}
                            </p>
                          </div>

                          {/* MAMA TITI'S GUIDANCE on the question itself */}
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

                          {/* CHILD'S ANSWER(S) — every exchange after the
                              first is the child's own typed reply
                              (topic), with Mama Titi's feedback on it
                              (mamaReply). Reads top-to-bottom as a real
                              back-and-forth: earlier tries are struck
                              through, the last one is highlighted as
                              the current/final answer. */}
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

        {/* VIEW 2: EXAM REVISION FLOW (Max 4 Taps Deep) */}
        {activeView === 'revision' && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Folder Breadcrumb Navigation */}
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

            {/* STEP 1: CHOOSE YOUR EXAM */}
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

            {/* STEP 2: CHOOSE SUBJECT AND TOPIC */}
            {selectedExam && !selectedTopic && (
              <div className="space-y-6">
                
                {/* Exam Title Banner */}
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

                {/* Honest status while every subject is being rebuilt with verified content */}
                {selectedExam.subjects.length === 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 leading-relaxed">
                    <strong>Rebuilding with verified curriculum:</strong> we removed all questions here to check each one against the real official Nigerian curriculum documents before bringing them back. Subjects below will unlock as they're verified.
                  </div>
                )}

                {/* Subject Selector Buttons — real subjects + honest Coming Soon ones */}
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

                {/* Topics Folder List under selected subject */}
                {selectedSubject ? (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-slate-900 flex items-center space-x-2">
                        <span>{selectedSubject.icon}</span>
                        <span>{selectedSubject.name} NERDC Topics</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        {selectedSubject.topics.length} Topics
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedSubject.topics.map((topic, tIdx) => (
                        <button
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic)}
                          className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-left transition-all flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase">
                              {topic.nerdcUnit}
                            </span>
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
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                    <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-600 font-jakarta font-bold">
                      Tap a subject icon above to view NERDC curriculum topics.
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* STEP 3 & STEP 4: GENERATE REVISION QUESTIONS + SOLVE OR PRINT */}
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
                
                {/* Topic Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {selectedExam.title} · {selectedTopic.nerdcUnit}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      {selectedTopic.name}
                    </h2>
                  </div>

                  {/* Step 4: Solve or Print Options */}
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

                {/* CLEAR LEARNING OBJECTIVES FOR THE TOPIC */}
                <div className="p-4 rounded-2xl bg-[#022C22] text-white space-y-2 border border-amber-400/40 shadow-xs">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-serif font-bold text-xs uppercase tracking-wider">
                      NERDC Official Learning Objectives
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

                {/* REVISION QUESTIONS LIST */}
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      Past Revision Questions
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

                        {/* Multiple Choice Options */}
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

                        {/* Text-based Feedback from Mama Titi */}
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

                  {/* Submit Answers Button */}
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
