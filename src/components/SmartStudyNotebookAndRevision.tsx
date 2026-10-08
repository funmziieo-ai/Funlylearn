import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Printer,
  Folder,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Check,
  Edit3,
  RefreshCw,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, UserSubscription } from '../types';
import {
  fetchHomeworkRecords,
  HomeworkRecord,
  fetchExamRevisionQuestions,
  ExamQuestionRow,
  getNotebookDailyViewCount,
  incrementNotebookDailyViewCount,
  getExamPrepDailyAttemptCount,
  incrementExamPrepDailyAttemptCount,
  getWeeklyTest,
  WeeklyTestQuestion,
  WeeklyTestResult,
  WeeklyTestTopicResult,
  saveWeeklyTestResult,
  getLatestWeeklyTestResult,
  getClassNotesForSession,
  ClassNotesResult,
  ClassNotesOutcome
} from '../services/supabaseService';

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
const DAY_MS = 24 * 60 * 60 * 1000;

// Derives which JSS grade(s) a topic's questions come from, based on
// its stored nerdcUnit text — e.g. "JSS1 Chapter 5" -> ['JSS1'],
// "BECE Chapter — Simple Equations (JSS1-3)" -> all three.
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
  firstDate: string;
}

// Same subject can arrive under different names ("English" vs
// "English Studies"); normalized once here so there are no duplicate
// subject tabs.
function normalizeSubjectName(subject: string | null): string | null {
  if (!subject) return subject;
  const trimmed = subject.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'english studies' || lower === 'english language') return 'English';
  return trimmed;
}

function groupIntoSessions(records: HomeworkRecord[]): StudySession[] {
  const sessionMap = new Map<string, StudySession>();

  for (const record of records) {
    const key = record.sessionId || `single-${record.id}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        sessionId: key,
        subject: normalizeSubjectName(record.subject),
        exchanges: [],
        resolved: false,
        latestDate: record.createdAt,
        firstDate: record.createdAt
      });
    }
    const session = sessionMap.get(key)!;
    session.exchanges.push(record);
    session.latestDate = record.createdAt;
    if (!session.subject && record.subject) {
      session.subject = normalizeSubjectName(record.subject);
    }
    if (new Date(record.createdAt) < new Date(session.firstDate)) {
      session.firstDate = record.createdAt;
    }
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

interface DayPage {
  dateKey: string;
  displayDate: string;
  sessions: StudySession[];
}

// One notebook page per calendar day, grouped by the day a topic was
// first asked, so a topic stays on its original day even if the child
// finishes it later.
function groupSessionsByDay(sessions: StudySession[]): DayPage[] {
  const dayMap = new Map<string, DayPage>();

  for (const session of sessions) {
    const d = new Date(session.firstDate);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        dateKey,
        displayDate: d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
        sessions: []
      });
    }
    dayMap.get(dateKey)!.sessions.push(session);
  }

  return Array.from(dayMap.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

// The starter chips on a fresh chat ("Help me with Mathematics"). Used
// only so the "topics covered" count doesn't include sessions that
// were just a greeting. Deciding what gets a notebook page now happens
// on the server.
function isGenericSubjectPrompt(topic: string): boolean {
  const normalized = topic.trim().toLowerCase();
  return /^(help me with|ran mi lọwọ pẹlu)\s+\w+/.test(normalized) && normalized.split(' ').length <= 5;
}

type ReadyOutcome = Extract<ClassNotesOutcome, { kind: 'ready' }>;

function isReady(outcome: ClassNotesOutcome | undefined): outcome is ReadyOutcome {
  return !!outcome && outcome.kind === 'ready';
}

function triesLabel(count: number): string {
  return `${count} ${count === 1 ? 'try' : 'tries'}`;
}

// Happy chime. small = two quick notes (e.g. revealing an answer);
// otherwise the four-note chime the chat plays for a correct answer.
function playChime(small = false) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = small ? [784, 1047] : [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      const start = audioCtx.currentTime + i * (small ? 0.12 : 0.15);
      gainNode.gain.setValueAtTime(small ? 0.15 : 0.3, start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  } catch (_e) {}
}

function celebrate(big: boolean) {
  playChime(false);
  const base = { spread: 75, zIndex: 9999, colors: ['#16A34A', '#FFC83D', '#FF6B35', '#38BDF8', '#A855F7'] };
  confetti({ ...base, particleCount: big ? 140 : 80, origin: { y: 0.6 } });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount: 70, angle: 120, origin: { x: 1, y: 0.7 } }), 450);
  }
}

// The WhatsApp message sent to a parent or teacher after the challenge.
function buildTestResultMessage(profile: UserProfile, result: WeeklyTestResult): string {
  const stars = '⭐'.repeat(starsFor(result.score, result.total));
  const lines = [`🏆 ${profile.name}'s Weekly Challenge (${profile.classLevel})`, `Score: ${result.score} / ${result.total} ${stars}`, ''];
  result.topicResults
    .filter((t) => t.needsPractice)
    .forEach((t) => {
      lines.push(
        t.improved
          ? `🚀 Improved: ${t.topic} (${t.correct}/${t.total})`
          : `💪 Still practising: ${t.topic} (${t.correct}/${t.total})`
      );
    });
  const others = result.topicResults.filter((t) => !t.needsPractice);
  if (others.length > 0) {
    const correct = others.reduce((sum, t) => sum + t.correct, 0);
    const total = others.reduce((sum, t) => sum + t.total, 0);
    lines.push(`⭐ Other topics: ${correct}/${total} correct`);
  }
  lines.push('', 'Sent from FunlyLearn (funlylearn.com)');
  return lines.join('\n');
}

// ---------- Fun design tokens ----------
// Fredoka for headings, Nunito for reading -- rounded, friendly fonts
// in the spirit of Duolingo, sized for children (17-18px body).
const FUN = "font-['Fredoka']";
const READ = "font-['Nunito']";
const DOTS: React.CSSProperties = {
  backgroundImage: 'radial-gradient(rgba(6,78,59,0.10) 1.5px, transparent 1.5px)',
  backgroundSize: '22px 22px'
};
// Chunky "press down" effect for buttons.
const PRESS = 'transition-transform active:translate-y-[3px] active:border-b-[1px]';
const CHIP_COLORS = [
  'bg-[#E0F4FF] text-[#0284C7]',
  'bg-[#F3E8FF] text-[#7E22CE]',
  'bg-[#FFF4D1] text-[#8A5A00]',
  'bg-[#FFE8DE] text-[#D9480F]',
  'bg-[#DCFCE7] text-[#064E3B]'
];

// Loads the two fonts once, so no change to index.html is needed.
function useFunFonts() {
  React.useEffect(() => {
    const id = 'funlylearn-fun-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap';
    document.head.appendChild(link);
  }, []);
}

function subjectEmoji(subject: string | null): string {
  const s = (subject || '').toLowerCase();
  if (/math/.test(s)) return '🔢';
  if (/english/.test(s)) return '📖';
  if (/science|biology|chemistry|physics/.test(s)) return '🔬';
  if (/social|civic|government|history/.test(s)) return '🌍';
  if (/yoruba|igbo|hausa/.test(s)) return '🗣️';
  if (/computer|technology/.test(s)) return '💻';
  return '📘';
}

function shortDate(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

function starsFor(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.round((score / total) * 5));
}

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`${FUN} text-lg font-semibold text-slate-700 mb-2 ${className}`}>{children}</p>
);

// One homework session = one fun notebook lesson card.
const ClassNotesEntry: React.FC<{
  sessionId: string;
  fallbackTopic: string;
  subject: string;
  profile: UserProfile;
  time: string;
  onResult: (sessionId: string, outcome: ClassNotesOutcome) => void;
}> = ({ sessionId, fallbackTopic, subject, profile, time, onResult }) => {
  const [outcome, setOutcome] = useState<ClassNotesOutcome | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  React.useEffect(() => {
    let cancelled = false;
    setOutcome(null);
    getClassNotesForSession(sessionId, profile.classLevel, profile.language, { force: retryCount > 0 }).then(
      (result) => {
        if (cancelled) return;
        setOutcome(result);
        onResult(sessionId, result);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, retryCount]);

  if (!outcome) {
    return (
      <div className={`py-8 flex items-center justify-center gap-2 text-base text-slate-500 ${READ} print:hidden`}>
        <span className="text-2xl animate-bounce">✏️</span>
        <span className="font-semibold">Writing your notes...</span>
      </div>
    );
  }

  // Nothing to write about (a greeting, "Help me with Maths").
  if (outcome.kind === 'skipped') return null;

  if (outcome.kind === 'error') {
    return (
      <div className={`rounded-3xl bg-white border-2 border-slate-200 p-5 text-center space-y-2 ${READ} print:hidden`}>
        <p className="text-3xl">😕</p>
        <p className={`${FUN} text-lg font-semibold text-slate-800`}>{fallbackTopic}</p>
        <p className="text-sm text-slate-500">These notes didn't load. Check your internet and try again.</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className={`${FUN} ${PRESS} px-5 py-2.5 rounded-2xl bg-[#16A34A] text-white font-semibold border-b-4 border-[#064E3B]`}
        >
          🔄 Try again
        </button>
      </div>
    );
  }

  const notes = outcome.notes;
  const won = notes.status === 'won';
  const theme = won
    ? { band: 'bg-[#16A34A]', border: 'border-[#16A34A]/30', sub: 'text-emerald-100', step: 'bg-[#16A34A]', answerBg: 'bg-[#DCFCE7]', answerText: 'text-[#064E3B]' }
    : { band: 'bg-[#FF6B35]', border: 'border-[#FF6B35]/30', sub: 'text-orange-100', step: 'bg-[#FF6B35]', answerBg: 'bg-[#FFE8DE]', answerText: 'text-[#D9480F]' };

  const triesNote = won
    ? notes.attemptsCount <= 1
      ? 'Got it on the first try! 🎉'
      : `Got it after ${notes.attemptsCount} tries! 🎉`
    : notes.attemptsCount === 0
    ? "Not answered yet. You can do it! 💪"
    : `${triesLabel(notes.attemptsCount)} so far. Practice makes perfect! 💪`;

  const revealAnswer = (i: number) => {
    setRevealed((prev) => ({ ...prev, [i]: true }));
    playChime(true);
  };

  return (
    <article className={`rounded-3xl bg-white border-2 ${theme.border} overflow-hidden print:break-inside-avoid print:border-slate-300 ${READ}`}>
      <div className={`${theme.band} text-white px-5 py-4 flex items-start justify-between gap-3 print:bg-white print:text-slate-900 print:border-b print:border-slate-300`}>
        <div className="min-w-0">
          <p className={`${theme.sub} text-sm font-bold print:text-slate-500`}>
            {time} · {subjectEmoji(notes.subject || subject)} {notes.subject || subject}
          </p>
          <h3 className={`${FUN} text-2xl font-bold leading-tight`}>{notes.cleanTopic}</h3>
        </div>
        {won ? (
          <span className={`${FUN} shrink-0 rotate-6 px-3 py-1.5 rounded-xl bg-[#FFC83D] text-[#064E3B] font-bold text-base border-b-4 border-[#E0A800]`}>
            GOT IT! ⭐
          </span>
        ) : (
          <span className={`${FUN} shrink-0 -rotate-6 px-3 py-1.5 rounded-xl bg-white text-[#D9480F] font-bold text-base border-b-4 border-orange-200 print:border-2 print:border-orange-300`}>
            KEEP GOING 💪
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5 text-[17px] text-slate-800">
        {notes.keyWords.length > 0 && (
          <div>
            <SectionTitle>🔑 Key words</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {notes.keyWords.map((word, i) => (
                <span key={word} className={`px-3 py-1.5 rounded-full font-bold ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes.meaning && (
          <div className="rounded-2xl bg-[#E0F4FF] p-4 print:border print:border-sky-200">
            <p className={`${FUN} text-lg font-semibold text-[#0284C7] mb-1`}>💡 What it means</p>
            <p className="text-lg leading-relaxed">{notes.meaning}</p>
          </div>
        )}

        {notes.steps.length > 0 && (
          <div>
            <SectionTitle>🪜 How to do it</SectionTitle>
            <ol className="space-y-2">
              {notes.steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className={`${FUN} ${theme.step} w-8 h-8 rounded-full text-white font-bold flex items-center justify-center shrink-0 print:bg-white print:text-slate-900 print:border print:border-slate-400`}>
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {notes.workedExample && (
          <div className="rounded-2xl bg-[#FFF4D1] border-2 border-[#FFC83D] p-4">
            <p className={`${FUN} text-lg font-semibold text-[#8A5A00] mb-1`}>🧺 Story time</p>
            <p className="text-lg leading-relaxed whitespace-pre-line">{notes.workedExample}</p>
          </div>
        )}

        {(notes.workQuestion || notes.childAnswer) && (
          <div className="space-y-2">
            <SectionTitle className="mb-0">✏️ My work</SectionTitle>
            {notes.workQuestion && (
              <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 max-w-[90%]">
                <p className="text-sm font-bold text-slate-500">The question</p>
                <p>{notes.workQuestion}</p>
              </div>
            )}
            <div className={`rounded-2xl rounded-tr-md ${theme.answerBg} px-4 py-3 max-w-[90%] ml-auto print:border print:border-slate-300`}>
              <p className={`text-sm font-bold ${theme.answerText}`}>{profile.name} said</p>
              <p className={`${FUN} text-xl font-semibold ${theme.answerText}`}>
                {notes.childAnswer || '...'} {won ? '✅' : '🤔'}
              </p>
            </div>
            <p className="text-sm text-slate-500 text-center font-semibold">{triesNote}</p>
          </div>
        )}

        {notes.evaluation.length > 0 && (
          <div className="space-y-2">
            <SectionTitle className="mb-0">🎯 Try these</SectionTitle>
            {notes.evaluation.map((item, i) => (
              <div key={i} className="rounded-2xl border-2 border-slate-200 p-3 flex items-center justify-between gap-3 flex-wrap">
                <span>
                  <b className={`${FUN} text-[#064E3B]`}>{i + 1}.</b> {item.question}
                </span>
                {revealed[i] ? (
                  <span className={`${FUN} px-4 py-2 rounded-xl bg-[#DCFCE7] text-[#064E3B] font-semibold`}>✅ {item.answer}</span>
                ) : (
                  <button
                    onClick={() => revealAnswer(i)}
                    className={`${PRESS} px-4 py-2 rounded-xl bg-white border-2 border-b-4 border-slate-300 font-bold text-sm text-[#064E3B] print:hidden`}
                  >
                    👀 Show answer
                  </button>
                )}
              </div>
            ))}
            <p className="hidden print:block text-xs text-slate-500">
              Answers: {notes.evaluation.map((item, i) => `${i + 1}. ${item.answer}`).join('   ')}
            </p>
          </div>
        )}

        {notes.inShort && (
          <div className="rounded-2xl bg-[#F3E8FF] p-4 flex gap-3 items-start print:border print:border-purple-200">
            <span className="text-2xl">💬</span>
            <div>
              <p className={`${FUN} text-lg font-semibold text-[#7E22CE]`}>Remember this</p>
              <p className="text-lg">{notes.inShort}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#FFFBF2] border-2 border-dashed border-[#FFC83D] p-4 space-y-3">
          <p className={`${FUN} text-lg font-semibold text-[#8A5A00]`}>👨‍👩‍👧 For grown-ups</p>
          {notes.parentQuestion && (
            <div className="rounded-2xl bg-white px-4 py-3 border border-[#FFF4D1]">
              <p className="text-sm font-bold text-slate-500">Ask {profile.name} at home</p>
              <p>"{notes.parentQuestion}"</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <p>✍️ Parent's signature: ____________</p>
            <p>🧑‍🏫 Teacher's remark: ____________</p>
          </div>
        </div>
      </div>
    </article>
  );
};

// One day of the notebook.
const DayPageCard: React.FC<{
  dayPage: DayPage;
  subject: string;
  profile: UserProfile;
  breakBefore: boolean;
}> = ({ dayPage, subject, profile, breakBefore }) => {
  const [resultsMap, setResultsMap] = useState<Record<string, ClassNotesOutcome>>({});

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const isToday = dayPage.dateKey === todayKey;

  const handleResult = React.useCallback((sessionId: string, outcome: ClassNotesOutcome) => {
    setResultsMap((prev) => ({ ...prev, [sessionId]: outcome }));
  }, []);

  const outcomes = Object.values(resultsMap);
  const readyNotes = outcomes.filter(isReady).map((o) => o.notes);
  const gotIt = readyNotes.filter((n) => n.status === 'won');
  const practising = readyNotes.filter((n) => n.status === 'needs_help');
  const stillLoading = outcomes.length < dayPage.sessions.length;
  const everythingSkipped = !stillLoading && outcomes.every((o) => o.kind === 'skipped');

  if (everythingSkipped) return null;

  const handleSendToTeacher = () => {
    const lines = [`📒 ${profile.name}'s ${subject} learning, ${dayPage.displayDate}`, ''];
    gotIt.forEach((n) => lines.push(`⭐ Got it: ${n.cleanTopic}`));
    practising.forEach((n) => lines.push(`💪 Still practising: ${n.cleanTopic}`));
    const keyWords = Array.from(new Set(readyNotes.flatMap((n) => n.keyWords))).slice(0, 8);
    if (keyWords.length > 0) lines.push('', `🔑 Key words: ${keyWords.join(', ')}`);
    lines.push('', 'Sent from FunlyLearn (funlylearn.com)');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div
      className={`rounded-[28px] bg-white border-2 border-slate-200 p-4 sm:p-6 space-y-6 ${READ} print:border-0 print:p-0 ${breakBefore ? 'print:break-before-page' : ''}`}
      style={DOTS}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className={`${FUN} inline-block px-4 py-2 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-lg font-bold -rotate-1 border-b-4 border-[#E0A800]`}>
          📅 {shortDate(dayPage.dateKey)}
        </span>
        {readyNotes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {gotIt.length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-[#DCFCE7] text-[#064E3B] font-extrabold text-sm">⭐ {gotIt.length} got it</span>
            )}
            {practising.length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-[#FFE8DE] text-[#D9480F] font-extrabold text-sm">💪 {practising.length} practising</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {dayPage.sessions.map((session) => (
          <div key={session.sessionId} id={`entry-${session.sessionId}`} className="scroll-mt-24">
            <ClassNotesEntry
              sessionId={session.sessionId}
              fallbackTopic={session.exchanges[0]?.topic || subject}
              subject={subject}
              profile={profile}
              time={new Date(session.firstDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              onResult={handleResult}
            />
          </div>
        ))}
      </div>

      {isToday && readyNotes.length > 0 && (
        <button
          onClick={handleSendToTeacher}
          className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#16A34A] text-white text-xl font-semibold border-b-[6px] border-[#064E3B] print:hidden`}
        >
          📲 Send today's learning to my teacher
        </button>
      )}
    </div>
  );
};

export interface WeeklyQuizTopic {
  subject: string;
  topic: string;
  needsPractice: boolean;
}

interface DatedNotes {
  notes: ClassNotesResult;
  date: number;
  sessionId: string;
  groupSubject: string;
}

type PractiseStatus = 'needs_more' | 'not_tested' | 'improved';

const PRACTISE_STATUS_ORDER: Record<PractiseStatus, number> = { needs_more: 0, not_tested: 1, improved: 2 };

const StepBadge: React.FC<{ n: number }> = ({ n }) => (
  <span className={`${FUN} w-9 h-9 rounded-full bg-[#064E3B] text-white text-lg font-bold flex items-center justify-center shrink-0`}>
    {n}
  </span>
);

// "My Week": the weekly revision. Step 1 is revising the topics the
// child is still practising (tap one to open its notebook page), step
// 2 is the Weekly Challenge (the revision test), and a plain summary
// for grown-ups sits at the bottom.
const WeeklyRevisionSheet: React.FC<{
  sessions: StudySession[];
  profile: UserProfile;
  onStartQuiz: (topics: WeeklyQuizTopic[]) => void;
  onReviseTopic: (subject: string, sessionId: string) => void;
  latestTest: WeeklyTestResult | null;
}> = ({ sessions, profile, onStartQuiz, onReviseTopic, latestTest }) => {
  const { weekSessions, carrySessions, weekStart, weekEnd } = useMemo(() => {
    const now = Date.now();
    const age = (s: StudySession) => now - new Date(s.firstDate).getTime();
    return {
      weekSessions: sessions.filter((s) => age(s) <= 7 * DAY_MS),
      carrySessions: sessions.filter((s) => !s.resolved && age(s) > 7 * DAY_MS && age(s) <= 28 * DAY_MS),
      weekStart: new Date(now - 6 * DAY_MS),
      weekEnd: new Date(now)
    };
  }, [sessions]);

  const allIds = useMemo(
    () => [...weekSessions, ...carrySessions].map((s) => s.sessionId),
    [weekSessions, carrySessions]
  );

  const [outcomes, setOutcomes] = useState<Record<string, ClassNotesOutcome>>({});

  React.useEffect(() => {
    let cancelled = false;
    setOutcomes({});
    allIds.forEach((id) => {
      getClassNotesForSession(id, profile.classLevel, profile.language).then((outcome) => {
        if (!cancelled) setOutcomes((prev) => ({ ...prev, [id]: outcome }));
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIds.join('|')]);

  const isLoading = Object.keys(outcomes).length < allIds.length;

  const toDated = (list: StudySession[]): DatedNotes[] => {
    const result: DatedNotes[] = [];
    list.forEach((s) => {
      const outcome = outcomes[s.sessionId];
      if (isReady(outcome)) {
        result.push({
          notes: outcome.notes,
          date: new Date(s.firstDate).getTime(),
          sessionId: s.sessionId,
          groupSubject: s.subject || 'General'
        });
      }
    });
    return result;
  };

  const weekNotes = toDated(weekSessions);
  const carryNotes = toDated(carrySessions);
  const gotIt = weekNotes.filter((d) => d.notes.status === 'won');
  const practisingThisWeek = weekNotes.filter((d) => d.notes.status === 'needs_help');

  const topicKey = (n: ClassNotesResult) => n.cleanTopic.trim().toLowerCase();

  // A struggle drops off once the child gets the same topic right in a
  // later homework session.
  const practiseMap = new Map<string, DatedNotes>();
  [...practisingThisWeek, ...carryNotes].forEach((d) => {
    const solvedLater = gotIt.some((w) => topicKey(w.notes) === topicKey(d.notes) && w.date > d.date);
    if (solvedLater) return;
    const existing = practiseMap.get(topicKey(d.notes));
    if (!existing || d.notes.attemptsCount > existing.notes.attemptsCount) {
      practiseMap.set(topicKey(d.notes), d);
    }
  });

  const latestTestTime = latestTest ? new Date(latestTest.createdAt).getTime() : 0;
  const practiseRows = Array.from(practiseMap.values())
    .map((d) => {
      const result = latestTest && latestTestTime > d.date
        ? latestTest.topicResults.find((t) => t.topic.trim().toLowerCase() === topicKey(d.notes))
        : undefined;
      const status: PractiseStatus = !result ? 'not_tested' : result.improved ? 'improved' : 'needs_more';
      return { d, status, result };
    })
    .sort((a, b) =>
      PRACTISE_STATUS_ORDER[a.status] - PRACTISE_STATUS_ORDER[b.status] ||
      b.d.notes.attemptsCount - a.d.notes.attemptsCount
    );

  const stillPractising = practiseRows.filter((r) => r.status !== 'improved');
  const improved = practiseRows.filter((r) => r.status === 'improved');

  const keyWords = Array.from(new Set(weekNotes.flatMap((d) => d.notes.keyWords))).slice(0, 14);
  const gotItTopics = Array.from(new Set(gotIt.map((d) => d.notes.cleanTopic)));

  const handleStartQuiz = () => {
    const seen = new Set<string>();
    const topics: WeeklyQuizTopic[] = [];
    const add = (n: ClassNotesResult, needsPractice: boolean) => {
      const key = topicKey(n);
      if (seen.has(key)) return;
      seen.add(key);
      topics.push({ subject: n.subject || 'General', topic: n.cleanTopic, needsPractice });
    };
    stillPractising.forEach((r) => add(r.d.notes, true));
    improved.forEach((r) => add(r.d.notes, false));
    gotIt.forEach((d) => add(d.notes, false));
    if (topics.length > 0) onStartQuiz(topics);
  };

  const formatShort = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (allIds.length === 0) {
    return (
      <div className={`rounded-[28px] bg-white border-2 border-slate-200 p-6 text-center space-y-2 ${READ}`} style={DOTS}>
        <p className="text-5xl">🗓️</p>
        <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>Your week starts here!</p>
        <p className="text-slate-600">
          Do homework with Mama Titi this week, and your revision and Weekly Challenge will appear here.
        </p>
      </div>
    );
  }

  const statusChip = (row: typeof practiseRows[number]) => {
    if (row.status === 'improved') {
      return <span className="px-3 py-1.5 rounded-full bg-[#16A34A] text-white text-sm font-extrabold shrink-0">🚀 Improved!</span>;
    }
    if (row.status === 'needs_more') {
      return <span className="px-3 py-1.5 rounded-full bg-[#FF6B35] text-white text-sm font-extrabold shrink-0">💪 Keep going</span>;
    }
    return <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-extrabold shrink-0">Not tested yet</span>;
  };

  return (
    <div className={`rounded-[28px] bg-white border-2 border-slate-200 p-4 sm:p-6 space-y-7 ${READ} print:border-0 print:p-0`} style={DOTS}>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className={`${FUN} text-3xl font-bold text-[#064E3B]`}>{profile.name}'s Week 🗓️</p>
          <span className={`${FUN} px-4 py-2 rounded-2xl bg-[#FFC83D] text-[#064E3B] font-bold border-b-4 border-[#E0A800]`}>
            {formatShort(weekStart)} – {formatShort(weekEnd)}
          </span>
        </div>
        <p className="text-slate-600 font-semibold">Your weekly revision: practise your 💪 topics, then take the challenge!</p>
      </div>

      {isLoading && weekNotes.length === 0 && carryNotes.length === 0 ? (
        <div className="py-8 flex items-center justify-center gap-2 text-slate-500 font-semibold">
          <span className="text-2xl animate-bounce">🗓️</span>
          <span>Getting your week ready...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#E0F4FF] p-3 text-center border-b-4 border-[#38BDF8]">
              <p className="text-2xl">📚</p>
              <p className={`${FUN} text-3xl font-bold text-[#0284C7]`}>{weekNotes.length}</p>
              <p className="text-sm font-bold text-[#0284C7]">topics</p>
            </div>
            <div className="rounded-2xl bg-[#DCFCE7] p-3 text-center border-b-4 border-[#16A34A]">
              <p className="text-2xl">⭐</p>
              <p className={`${FUN} text-3xl font-bold text-[#064E3B]`}>{gotIt.length}</p>
              <p className="text-sm font-bold text-[#064E3B]">got it</p>
            </div>
            <div className="rounded-2xl bg-[#FFE8DE] p-3 text-center border-b-4 border-[#FF6B35]">
              <p className="text-2xl">💪</p>
              <p className={`${FUN} text-3xl font-bold text-[#D9480F]`}>{stillPractising.length}</p>
              <p className="text-sm font-bold text-[#D9480F]">practising</p>
            </div>
            <div className="rounded-2xl bg-[#F3E8FF] p-3 text-center border-b-4 border-[#A855F7]">
              <p className="text-2xl">🚀</p>
              <p className={`${FUN} text-3xl font-bold text-[#7E22CE]`}>{latestTest ? improved.length : '–'}</p>
              <p className="text-sm font-bold text-[#7E22CE]">improved</p>
            </div>
          </div>

          {/* Step 1: revise */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StepBadge n={1} />
              <p className={`${FUN} text-2xl font-bold text-slate-800`}>Revise these 💪</p>
            </div>
            {practiseRows.length === 0 ? (
              <div className="rounded-2xl bg-[#DCFCE7] p-4 text-center">
                <p className="text-3xl">🎉</p>
                <p className={`${FUN} text-lg font-semibold text-[#064E3B]`}>Nothing to practise. You got everything right this week!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {practiseRows.map((row) => (
                  <button
                    key={topicKey(row.d.notes)}
                    onClick={() => onReviseTopic(row.d.groupSubject, row.d.sessionId)}
                    className={`${PRESS} w-full text-left rounded-2xl bg-white border-2 border-b-4 border-[#FF6B35]/40 p-4 flex items-center gap-3`}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-[#FFE8DE] flex items-center justify-center text-2xl shrink-0">
                      {subjectEmoji(row.d.notes.subject || row.d.groupSubject)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`${FUN} block text-xl font-semibold text-slate-800`}>{row.d.notes.cleanTopic}</span>
                      <span className="block text-sm text-slate-500 font-semibold">
                        {row.result
                          ? `${row.result.correct}/${row.result.total} in the challenge · tap to revise`
                          : 'Tap to revise your notes'}
                      </span>
                    </span>
                    {statusChip(row)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: the Weekly Challenge (revision test) */}
          {(practiseRows.length > 0 || gotIt.length > 0) && (
            <div className="space-y-3 print:hidden">
              <div className="flex items-center gap-3">
                <StepBadge n={2} />
                <p className={`${FUN} text-2xl font-bold text-slate-800`}>Take the Weekly Challenge 🏆</p>
              </div>
              <div className="rounded-3xl bg-[#064E3B] text-white p-5 border-b-[6px] border-[#03301F] space-y-3 text-center">
                <p className="text-5xl">🏆</p>
                <p className="text-emerald-100 font-semibold">
                  {latestTest
                    ? `Last score: ${latestTest.score} / ${latestTest.total}. Try again and beat it! 🔥`
                    : stillPractising.length > 0
                    ? '10 questions, mostly on your 💪 topics. Show how much you have improved!'
                    : '10 questions on this week\'s topics. You can do it!'}
                </p>
                <button
                  onClick={handleStartQuiz}
                  className={`${FUN} ${PRESS} w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-xl font-bold border-b-[6px] border-[#E0A800]`}
                >
                  {latestTest ? 'Play again ▶' : 'Start the challenge ▶'}
                </button>
              </div>
            </div>
          )}

          {gotItTopics.length > 0 && (
            <div className="space-y-2">
              <p className={`${FUN} text-2xl font-bold text-slate-800`}>⭐ You got these</p>
              <div className="flex flex-wrap gap-2">
                {gotItTopics.map((t) => (
                  <span key={t} className="px-4 py-2 rounded-2xl bg-[#DCFCE7] text-[#064E3B] font-bold">✓ {t}</span>
                ))}
              </div>
            </div>
          )}

          {keyWords.length > 0 && (
            <div className="space-y-2">
              <p className={`${FUN} text-2xl font-bold text-slate-800`}>🔑 Words of the week</p>
              <div className="flex flex-wrap gap-2">
                {keyWords.map((w, i) => (
                  <span key={w} className={`px-3 py-1.5 rounded-full font-bold ${CHIP_COLORS[i % CHIP_COLORS.length]}`}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* For grown-ups. Every line comes straight from the real
              results, not from the AI. */}
          <div className="rounded-2xl bg-[#FFFBF2] border-2 border-dashed border-[#FFC83D] p-4 space-y-3">
            <p className={`${FUN} text-xl font-semibold text-[#8A5A00]`}>👨‍👩‍👧 {profile.name}'s week, for grown-ups</p>
            <div className="grid gap-2 text-[16px]">
              <p className="rounded-xl bg-white px-4 py-2.5"><b>📚 Worked on:</b> {weekNotes.length} {weekNotes.length === 1 ? 'topic' : 'topics'}</p>
              {gotItTopics.length > 0 && (
                <p className="rounded-xl bg-white px-4 py-2.5"><b>⭐ Got it:</b> {gotItTopics.join(', ')}</p>
              )}
              <p className="rounded-xl bg-white px-4 py-2.5">
                <b>🏆 Weekly Challenge:</b> {latestTest ? `${latestTest.score} out of ${latestTest.total}` : 'not taken yet'}
              </p>
              {improved.length > 0 && (
                <p className="rounded-xl bg-white px-4 py-2.5"><b>🚀 Improved in:</b> {improved.map((r) => r.d.notes.cleanTopic).join(', ')}</p>
              )}
              {stillPractising.length > 0 ? (
                <p className="rounded-xl bg-white px-4 py-2.5"><b>💪 Still practising:</b> {stillPractising.map((r) => r.d.notes.cleanTopic).join(', ')}</p>
              ) : (
                practiseRows.length === 0 && (
                  <p className="rounded-xl bg-white px-4 py-2.5"><b>🎉 Everything this week was answered correctly.</b></p>
                )
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
              <p>✍️ Parent's signature: ____________</p>
              <p>🏆 Challenge score: {latestTest ? `${latestTest.score} / ${latestTest.total}` : '______'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const SmartStudyNotebookAndRevision: React.FC<SmartStudyNotebookAndRevisionProps> = ({
  profile,
  onProfileUpdate,
  userId,
  subscription,
  onOpenPricingModal
}) => {
  const isPremium = isPremiumActive(subscription);
  useFunFonts();

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
    fetchHomeworkRecords(userId, 200).then(records => {
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

  // Daily notebook pages ("all") or the end-of-week revision sheet.
  const [notebookMode, setNotebookMode] = useState<'all' | 'week'>('all');

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

  // Weekly test -- questions built from this week's topics, mostly on
  // the ones still being practised, each tagged with its topic so the
  // result shows per topic whether the child improved.
  const [weeklyQuiz, setWeeklyQuiz] = useState<WeeklyTestQuestion[] | null>(null);
  const [weeklyQuizTopicsKey, setWeeklyQuizTopicsKey] = useState<string>('');
  const [isLoadingWeeklyQuiz, setIsLoadingWeeklyQuiz] = useState(false);
  const [weeklyQuizError, setWeeklyQuizError] = useState<string | null>(null);
  const [weeklyQuizAnswers, setWeeklyQuizAnswers] = useState<Record<string, number>>({});
  const [weeklyQuizSubmitted, setWeeklyQuizSubmitted] = useState(false);
  const [showWeeklyQuiz, setShowWeeklyQuiz] = useState(false);
  const lastWeeklyTopicsRef = React.useRef<WeeklyQuizTopic[]>([]);
  const [latestTestResult, setLatestTestResult] = useState<WeeklyTestResult | null>(null);
  const [submittedResult, setSubmittedResult] = useState<WeeklyTestResult | null>(null);
  const [showChallengeAnswers, setShowChallengeAnswers] = useState(false);
  const [challengeHint, setChallengeHint] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getLatestWeeklyTestResult(userId).then((result) => {
      if (!cancelled) setLatestTestResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleStartWeeklyQuiz = async (topics: WeeklyQuizTopic[]) => {
    if (topics.length === 0) return;
    lastWeeklyTopicsRef.current = topics;
    setShowWeeklyQuiz(true);
    setWeeklyQuizAnswers({});
    setWeeklyQuizSubmitted(false);
    setSubmittedResult(null);
    setShowChallengeAnswers(false);
    setChallengeHint(null);

    // Reuse the loaded test only if the topics haven't changed since.
    const topicsKey = topics.map((t) => `${t.topic}:${t.needsPractice ? 1 : 0}`).join('|');
    if (weeklyQuiz && topicsKey === weeklyQuizTopicsKey) return;

    setIsLoadingWeeklyQuiz(true);
    setWeeklyQuizError(null);

    const questions = await getWeeklyTest(userId, profile.classLevel, profile.language, topics);

    if (questions) {
      setWeeklyQuiz(questions);
      setWeeklyQuizTopicsKey(topicsKey);
    } else {
      setWeeklyQuizError("This week's test didn't load. Check your internet connection and try again.");
    }
    setIsLoadingWeeklyQuiz(false);
  };

  const handleSelectWeeklyAnswer = (questionId: string, optionIndex: number) => {
    if (weeklyQuizSubmitted) return;
    setWeeklyQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const weeklyQuizScore = weeklyQuiz
    ? weeklyQuiz.filter((q) => weeklyQuizAnswers[q.id] === q.correctOptionIndex).length
    : 0;

  const handleSubmitWeeklyQuiz = () => {
    if (!weeklyQuiz) return;

    const byTopic = new Map<string, WeeklyTestTopicResult>();
    weeklyQuiz.forEach((q) => {
      const key = q.topic.trim().toLowerCase();
      const entry = byTopic.get(key) || {
        topic: q.topic,
        subject: q.subject,
        needsPractice: q.needsPractice,
        correct: 0,
        total: 0,
        improved: false
      };
      entry.total += 1;
      if (weeklyQuizAnswers[q.id] === q.correctOptionIndex) entry.correct += 1;
      byTopic.set(key, entry);
    });

    // Improved = a practice topic with at least two thirds right.
    const topicResults = Array.from(byTopic.values()).map((t) => ({
      ...t,
      improved: t.needsPractice && t.correct / t.total >= 2 / 3
    }));

    const result: WeeklyTestResult = {
      score: weeklyQuizScore,
      total: weeklyQuiz.length,
      topicResults,
      createdAt: new Date().toISOString()
    };

    setWeeklyQuizSubmitted(true);
    setSubmittedResult(result);
    setLatestTestResult(result);
    saveWeeklyTestResult(userId, result);

    // Confetti and the chime only for a perfect score.
    if (result.score === result.total) {
      celebrate(true);
    }
  };

  const sendTestResult = (to: 'parent' | 'teacher') => {
    if (!submittedResult) return;
    const text = encodeURIComponent(buildTestResultMessage(profile, submittedResult));
    const parentNumber = (profile.parentWhatsApp || '').replace(/[^\d]/g, '');
    const url = to === 'parent' && parentNumber
      ? `https://wa.me/${parentNumber}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // From My Week: open the notebook page for a topic to revise.
  const handleReviseTopic = (subject: string, sessionId: string) => {
    setNotebookMode('all');
    setActiveNotebookSubject(subject);
    setTimeout(() => {
      document.getElementById(`entry-${sessionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
  };

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

  // Printing the notebook is a paid feature (as the upgrade prompts
  // already promise). Trial users count as paid.
  const handlePrintNotebook = () => {
    if (!isPremium) {
      onOpenPricingModal();
      return;
    }
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

  // Sessions that were only a starter greeting don't count as topics.
  const realSessions = studySessions.filter(
    (s) => !s.exchanges.every((ex) => isGenericSubjectPrompt(ex.topic))
  );
  const totalTopics = realSessions.length;
  const totalCorrect = realSessions.filter(s => s.resolved).length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-28 font-sans print:p-0 print:pb-0">

      {/* Print version of an Exam Revision topic. The notebook prints
          straight from its own on-screen pages (see below). */}
      <div className={activeView === 'revision' && selectedTopic ? 'hidden print:block print:p-0 print:m-0 print:bg-white print:text-black' : 'hidden'}>
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

        {selectedTopic && (
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
        )}

        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
          Generated via FunlyLearn Companion
        </div>
      </div>

      <div className="space-y-6">

        <div className={`rounded-3xl bg-[#064E3B] text-white p-5 border-b-[6px] border-[#03301F] flex items-center gap-4 ${READ} print:hidden`}>
          <div className={`${FUN} w-16 h-16 rounded-2xl bg-[#FFC83D] text-[#064E3B] flex items-center justify-center text-3xl font-bold shrink-0 border-b-4 border-[#E0A800]`}>
            {(profile.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${FUN} text-2xl font-bold leading-tight truncate`}>{profile.name}</p>
            <p className="text-emerald-100 text-sm font-semibold">
              {profile.classLevel} · {profile.isOutOfSchool ? 'Catch Up Scholar' : 'Student Scholar'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#FFC83D] text-[#064E3B] text-sm font-extrabold">⭐ {profile.stars}</span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-sm font-extrabold">🪙 {profile.coins || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">

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
                Every homework session with Mama Titi becomes a proper notebook page, ready to revise, print, and sign.
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
          <div className={`space-y-5 animate-fadeIn ${READ} print:space-y-0`}>

            <div className="grid grid-cols-2 gap-2 bg-white rounded-2xl p-1.5 border-2 border-slate-200 print:hidden">
              <button
                onClick={() => setNotebookMode('all')}
                className={`py-3 rounded-xl ${FUN} text-lg font-semibold transition-all ${
                  notebookMode === 'all' ? 'bg-[#16A34A] text-white' : 'text-slate-500'
                }`}
              >
                📒 My Notes
              </button>
              <button
                onClick={() => setNotebookMode('week')}
                className={`py-3 rounded-xl ${FUN} text-lg font-semibold leading-tight transition-all ${
                  notebookMode === 'week' ? 'bg-[#16A34A] text-white' : 'text-slate-500'
                }`}
              >
                🗓️ My Week
                <span className="block text-xs font-bold opacity-80">Revision + Challenge</span>
              </button>
            </div>

            {notebookMode === 'week' && !isPremium ? (
              <div className="rounded-[28px] bg-white border-2 border-slate-200 p-6 text-center space-y-3 print:hidden" style={DOTS}>
                <p className="text-5xl">🔒</p>
                <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>Unlock My Week</p>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Weekly revision of everything {profile.name} learned, the topics to practise, and a fun Weekly Challenge. Included in the Basic and Family plans.
                </p>
                <button
                  onClick={onOpenPricingModal}
                  className={`${FUN} ${PRESS} px-8 py-3.5 rounded-2xl bg-[#FF6B35] text-white text-lg font-semibold border-b-[5px] border-[#D9480F]`}
                >
                  See plans
                </button>
              </div>
            ) : (
              <>
                {/* Cover page -- only appears on paper. */}
                <div className="hidden print:flex flex-col items-center justify-center text-center min-h-[85vh] break-after-page space-y-3">
                  <p className="text-6xl">📒</p>
                  <p className={`${FUN} text-4xl font-bold text-slate-900`}>{profile.name}'s Notebook</p>
                  <p className="text-lg text-slate-800">Class: {profile.classLevel}</p>
                  <p className="text-lg text-slate-800">
                    {notebookMode === 'week' ? 'My Week: revision' : `Subject: ${activeNotebookSubject || 'All subjects'}`}
                  </p>
                  <p className="text-slate-600">
                    {totalTopics} topics covered · {totalCorrect} answered correctly
                  </p>
                  <p className="text-slate-600">Printed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-500 pt-10">FunlyLearn · NERDC aligned · funlylearn.com</p>
                </div>

                <div className="flex items-center justify-between gap-2 print:hidden">
                  {notebookMode === 'all' && subjectGroups.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 min-w-0">
                      {subjectGroups.map((group) => {
                        const active = activeNotebookSubject === group.subject;
                        return (
                          <button
                            key={group.subject}
                            onClick={() => setActiveNotebookSubject(group.subject)}
                            className={`${FUN} px-4 py-2.5 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                              active
                                ? 'bg-[#16A34A] text-white border-b-4 border-[#064E3B]'
                                : 'bg-white text-slate-600 border-2 border-slate-200'
                            }`}
                          >
                            {subjectEmoji(group.subject)} {group.subject}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={handlePrintNotebook}
                    className={`${FUN} ${PRESS} shrink-0 px-4 py-2.5 rounded-2xl bg-white border-2 border-b-4 border-slate-300 font-semibold text-[#064E3B]`}
                  >
                    {isPremium ? '🖨️ Print' : '🔒 Print'}
                  </button>
                </div>

                {isLoadingNotes ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-slate-500 font-semibold">
                    <span className="text-3xl animate-bounce">📒</span>
                    <span>Opening your notebook...</span>
                  </div>
                ) : notebookLimitReached ? (
                  <div className="rounded-[28px] bg-white border-2 border-slate-200 p-6 text-center space-y-3 print:hidden" style={DOTS}>
                    <p className="text-5xl">📒</p>
                    <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>That's today's {FREE_DAILY_NOTEBOOK_VIEWS} free looks!</p>
                    <p className="text-slate-600 max-w-sm mx-auto">
                      Come back tomorrow, or upgrade to Basic or Family to open and print {profile.name}'s notebook anytime.
                    </p>
                    <button
                      onClick={onOpenPricingModal}
                      className={`${FUN} ${PRESS} px-8 py-3.5 rounded-2xl bg-[#FF6B35] text-white text-lg font-semibold border-b-[5px] border-[#D9480F]`}
                    >
                      See plans
                    </button>
                  </div>
                ) : notebookMode === 'week' ? (
                  <WeeklyRevisionSheet
                    sessions={studySessions}
                    profile={profile}
                    onStartQuiz={handleStartWeeklyQuiz}
                    onReviseTopic={handleReviseTopic}
                    latestTest={latestTestResult}
                  />
                ) : subjectGroups.length === 0 ? (
                  <div className="rounded-[28px] bg-white border-2 border-slate-200 p-6 text-center space-y-2" style={DOTS}>
                    <p className="text-5xl">📒</p>
                    <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>Your notebook is waiting!</p>
                    <p className="text-slate-600">
                      Do your homework with Mama Titi, and every lesson becomes a page here.
                    </p>
                  </div>
                ) : !activeSubjectGroup ? null : (
                  <div className="space-y-6">
                    {groupSessionsByDay(activeSubjectGroup.sessions).map((dayPage, index) => (
                      <DayPageCard
                        key={dayPage.dateKey}
                        dayPage={dayPage}
                        subject={activeSubjectGroup.subject}
                        profile={profile}
                        breakBefore={index > 0}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeView === 'revision' && (
          <div className="space-y-5 animate-fadeIn print:hidden">

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

      {/* Weekly Challenge (the weekly revision test) */}
      {showWeeklyQuiz && (
        <div className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto print:hidden ${READ}`}>
          <div className="bg-white rounded-[28px] max-w-lg w-full my-6 p-5 sm:p-6 space-y-5 border-b-8 border-slate-200 text-[17px] text-slate-800">

            <div className="flex items-center justify-between gap-3">
              <p className={`${FUN} text-2xl font-bold text-[#064E3B]`}>🏆 Weekly Challenge</p>
              <button
                onClick={() => setShowWeeklyQuiz(false)}
                aria-label="Close the challenge"
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {isLoadingWeeklyQuiz ? (
              <div className="py-10 text-center space-y-2">
                <span className="text-5xl block animate-bounce">🧠</span>
                <p className={`${FUN} text-xl font-semibold text-[#064E3B]`}>Getting your challenge ready...</p>
              </div>
            ) : weeklyQuizError ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-4xl">😕</p>
                <p className="text-slate-600">{weeklyQuizError}</p>
                <button
                  onClick={() => handleStartWeeklyQuiz(lastWeeklyTopicsRef.current)}
                  className={`${FUN} ${PRESS} px-6 py-3 rounded-2xl bg-[#16A34A] text-white font-semibold border-b-4 border-[#064E3B]`}
                >
                  🔄 Try again
                </button>
              </div>
            ) : weeklyQuiz && weeklyQuizSubmitted && submittedResult ? (
              (() => {
                const practice = submittedResult.topicResults.filter((t) => t.needsPractice);
                const others = submittedResult.topicResults.filter((t) => !t.needsPractice);
                const improvedCount = practice.filter((t) => t.improved).length;
                const stars = starsFor(submittedResult.score, submittedResult.total);
                const perfect = submittedResult.score === submittedResult.total;
                const headline = perfect
                  ? `Perfect score, ${profile.name}! 🌟`
                  : improvedCount > 0
                  ? `Ehhh! Well done, ${profile.name}!`
                  : `Well done for finishing, ${profile.name}!`;
                const subline = perfect
                  ? 'You got every single one right!'
                  : improvedCount > 0
                  ? `You improved in ${improvedCount} ${improvedCount === 1 ? 'topic' : 'topics'} 🚀`
                  : "Keep practising, you're getting better 💪";
                const hasParentNumber = !!(profile.parentWhatsApp || '').replace(/[^\d]/g, '');

                return (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <p className="text-7xl">{perfect ? '🏆' : improvedCount > 0 ? '🚀' : '💪'}</p>
                      <p className={`${FUN} text-3xl font-bold text-[#064E3B]`}>{headline}</p>
                      <p className="text-slate-600 font-semibold">{subline}</p>
                      <p className="text-3xl tracking-wider" aria-label={`${stars} out of 5 stars`}>
                        {'⭐'.repeat(stars)}
                        <span className="opacity-25">{'⭐'.repeat(5 - stars)}</span>
                      </p>
                      <p className={`${FUN} text-5xl font-bold text-[#FF6B35]`}>
                        {submittedResult.score} / {submittedResult.total}
                      </p>
                    </div>

                    {practice.length > 0 && (
                      <div className="space-y-2">
                        <p className={`${FUN} text-xl font-semibold`}>Your 💪 topics</p>
                        {practice.map((t) => (
                          <div
                            key={t.topic}
                            className={`rounded-2xl p-3 flex items-center justify-between gap-2 ${t.improved ? 'bg-[#DCFCE7]' : 'bg-[#FFE8DE]'}`}
                          >
                            <span className="font-bold">{subjectEmoji(t.subject)} {t.topic}</span>
                            <span
                              className={`px-3 py-1 rounded-full text-white text-sm font-extrabold shrink-0 ${t.improved ? 'bg-[#16A34A]' : 'bg-[#FF6B35]'}`}
                            >
                              {t.improved ? '🚀 Improved!' : '💪 Keep going'} {t.correct}/{t.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {others.length > 0 && (
                      <p className="text-sm text-slate-500 font-semibold text-center">
                        Other topics: {others.reduce((s, t) => s + t.correct, 0)}/{others.reduce((s, t) => s + t.total, 0)} correct ⭐
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => sendTestResult('parent')}
                        className={`${FUN} ${PRESS} py-3.5 rounded-2xl bg-[#16A34A] text-white text-lg font-semibold border-b-[5px] border-[#064E3B]`}
                      >
                        📲 {hasParentNumber ? 'Tell my parent' : 'Share my score'}
                      </button>
                      <button
                        onClick={() => sendTestResult('teacher')}
                        className={`${FUN} ${PRESS} py-3.5 rounded-2xl bg-white text-[#064E3B] text-lg font-semibold border-2 border-b-[5px] border-[#16A34A]`}
                      >
                        📲 Tell my teacher
                      </button>
                    </div>

                    <button
                      onClick={() => setShowChallengeAnswers((v) => !v)}
                      className={`${FUN} w-full py-2 text-[#064E3B] font-semibold`}
                    >
                      {showChallengeAnswers ? '🙈 Hide the answers' : '👀 See the answers'}
                    </button>

                    {showChallengeAnswers && (
                      <div className="space-y-3">
                        {weeklyQuiz.map((q, idx) => {
                          const isCorrect = weeklyQuizAnswers[q.id] === q.correctOptionIndex;
                          return (
                            <div key={q.id} className={`p-4 rounded-2xl border-2 ${isCorrect ? 'border-[#16A34A]/40 bg-[#DCFCE7]' : 'border-[#FF6B35]/40 bg-[#FFE8DE]'}`}>
                              <p className="font-bold">{isCorrect ? '✅' : '❌'} {idx + 1}. {q.question}</p>
                              <p className="text-sm text-slate-700 mt-1">
                                Answer: <strong>{q.options[q.correctOptionIndex]}</strong>
                              </p>
                              {q.explanation && <p className="text-sm text-slate-600 mt-1">{q.explanation}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setShowWeeklyQuiz(false)}
                      className={`${FUN} ${PRESS} w-full py-3.5 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-lg font-bold border-b-[5px] border-[#E0A800]`}
                    >
                      Done 🎉
                    </button>
                  </div>
                );
              })()
            ) : weeklyQuiz ? (
              (() => {
                const answered = Object.keys(weeklyQuizAnswers).length;
                const remaining = weeklyQuiz.length - answered;
                return (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16A34A] transition-all"
                          style={{ width: `${Math.round((answered / weeklyQuiz.length) * 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-500 font-bold text-center">
                        {answered} of {weeklyQuiz.length} answered
                      </p>
                    </div>

                    {weeklyQuiz.map((q, idx) => (
                      <div key={q.id} className="rounded-2xl border-2 border-slate-200 p-4 space-y-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                            q.needsPractice ? 'bg-[#FFE8DE] text-[#D9480F]' : 'bg-[#E0F4FF] text-[#0284C7]'
                          }`}
                        >
                          {q.needsPractice ? '💪 ' : subjectEmoji(q.subject) + ' '}{q.topic}
                        </span>
                        <p className={`${FUN} text-xl font-semibold`}>{idx + 1}. {q.question}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, oIdx) => {
                            const chosen = weeklyQuizAnswers[q.id] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  handleSelectWeeklyAnswer(q.id, oIdx);
                                  setChallengeHint(null);
                                }}
                                className={`${PRESS} text-left px-4 py-3 rounded-xl border-2 border-b-4 font-bold transition-colors ${
                                  chosen
                                    ? 'border-[#16A34A] bg-[#DCFCE7] text-[#064E3B]'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {challengeHint && (
                      <p className="text-center text-[#D9480F] font-bold">{challengeHint}</p>
                    )}
                    <button
                      onClick={() => {
                        if (remaining > 0) {
                          setChallengeHint(`Answer ${remaining} more ${remaining === 1 ? 'question' : 'questions'} to finish 😊`);
                          return;
                        }
                        handleSubmitWeeklyQuiz();
                      }}
                      className={`${FUN} ${PRESS} w-full py-4 rounded-2xl bg-[#FFC83D] text-[#064E3B] text-xl font-bold border-b-[6px] border-[#E0A800]`}
                    >
                      Finish the challenge 🎉
                    </button>
                  </div>
                );
              })()
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
