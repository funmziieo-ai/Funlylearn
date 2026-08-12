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
import { UserProfile } from '../types';
import { EXAM_REVISION_DATA, ExamType, ExamSubject, ExamTopic, ExamQuestion } from '../data/examRevisionData';
import { MamaTitiAvatar } from './MamaTitiAvatar';
import { fetchHomeworkRecords, HomeworkRecord } from '../services/supabaseService';

interface SmartStudyNotebookAndRevisionProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
  userId: string;
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
    { name: 'Mathematics', icon: '📐' },
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

function pickRandomQuestions(pool: ExamQuestion[], count: number): ExamQuestion[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

export const SmartStudyNotebookAndRevision: React.FC<SmartStudyNotebookAndRevisionProps> = ({
  profile,
  onProfileUpdate,
  userId
}) => {
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
    fetchHomeworkRecords(userId, 20).then(records => {
      if (!cancelled) {
        setCompiledNotes(records);
        setIsLoadingNotes(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Action: Print Personal Notebook or Exam Revision
  const handlePrint = () => {
    window.print();
  };

  // Action: Download Personal Notebook
  const handleDownloadNotebook = () => {
    let content = `========================================================\n`;
    content += `          FUNLYLEARN SMART STUDY NOTEBOOK             \n`;
    content += `========================================================\n\n`;
    content += `Student Name: ${profile.name}\n`;
    content += `Class Level: ${profile.classLevel}\n`;
    content += `Curriculum: Official Nigerian NERDC\n`;
    content += `Date Compiled: ${new Date().toLocaleDateString()}\n\n`;
    content += `--------------------------------------------------------\n`;
    content += `MY COMPILED HOMEWORK & LEARNING NOTES WITH MAMA TITI\n`;
    content += `--------------------------------------------------------\n\n`;

    compiledNotes.forEach((note, idx) => {
      content += `${idx + 1}. ${note.topic}\n`;
      content += `   Date: ${new Date(note.createdAt).toLocaleDateString()}\n`;
      if (note.wasCorrect !== null) {
        content += `   Result: ${note.wasCorrect ? 'Answered correctly' : 'Still practicing'}\n`;
      }
      content += `\n--------------------------------------------------------\n\n`;
    });

    content += `Generated via FunlyLearn AI Companion (NERDC Aligned)\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.name}_Smart_Study_Notebook.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              My Personal Study Notebook (Compiled from Mama Titi Homework Sessions)
            </h2>
            {compiledNotes.length === 0 ? (
              <p className="text-sm text-slate-600 italic">
                No homework sessions recorded yet. Chat with Mama Titi to build your notebook!
              </p>
            ) : (
              compiledNotes.map((note, i) => (
                <div key={note.id} className="p-4 border border-slate-300 rounded-lg space-y-2">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{i + 1}. {note.topic}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {note.wasCorrect !== null && (
                    <p className="text-xs text-slate-700">
                      {note.wasCorrect ? 'Answered correctly ✅' : 'Still practicing 💪'}
                    </p>
                  )}
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <MamaTitiAvatar size="md" showOnlineStatus={false} />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                    {profile.isOutOfSchool ? 'Catch Up Scholar' : 'Student Scholar'}
                  </span>
                  <span className="text-xs text-emerald-200">NERDC Aligned</span>
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
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⭐ {profile.stars} Stars</span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO CLEAR ENTRY POINTS AT TOP OF SCREEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* ENTRY POINT A: "Create Notebook" Button / Card */}
          <button
            onClick={() => setActiveView('notebook')}
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

        {/* VIEW 1: PERSONAL STUDY NOTEBOOK */}
        {activeView === 'notebook' && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-300/80 shadow-soft space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
              <div>
                <span className="text-[10px] font-jakarta font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  Mama Titi Compiled Notes
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#064E3B] mt-1">
                  {profile.name}'s Personal Study Notebook
                </h2>
                <p className="text-xs text-slate-600 font-sans mt-0.5">
                  Compiled from your recent homework chat sessions and learning quests.
                </p>
              </div>

              {/* Action Buttons: Print & Download */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-2xl bg-[#064E3B] hover:bg-[#022C22] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleDownloadNotebook}
                  className="px-3.5 py-2 rounded-2xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Compiled Note Cards — real homework sessions from Supabase */}
            {isLoadingNotes ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading your sessions...</div>
            ) : compiledNotes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-3xl block">📚</span>
                <p className="text-sm font-medium text-slate-600">No homework sessions yet</p>
                <p className="text-xs text-slate-400">
                  Chat with Mama Titi about your homework to start building your notebook!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {compiledNotes.map((note, idx) => (
                  <div key={note.id} className="p-4 sm:p-5 rounded-2xl bg-[#FFFBF5] border border-amber-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400 font-mono font-medium">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      {note.wasCorrect !== null && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          note.wasCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                        }`}>
                          {note.wasCorrect ? 'Correct ✅' : 'Practicing 💪'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                      {idx + 1}. {note.topic}
                    </h3>
                  </div>
                ))}
              </div>
            )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXAM_REVISION_DATA.map((exam) => (
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
            {selectedExam && selectedTopic && (
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
