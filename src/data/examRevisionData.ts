export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0 for A, 1 for B, 2 for C, 3 for D
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

// ==========================================
// REBUILD IN PROGRESS — subjects are being removed and re-added one
// at a time, ONLY after each is individually verified against a real,
// fetched official NERDC curriculum document (not just the citation
// label, but every question checked against actual listed topics and
// grade level). Even the previous "corrected" FSLC Mathematics entry
// still had real misalignment (LCM/HCF belongs to Primary 4, not
// Primary 6; "Roman Numerals" doesn't appear in the real curriculum
// at all) — so nothing goes back in without full verification.
// ==========================================

export const EXAM_REVISION_DATA: ExamType[] = [
  {
    id: 'fslc',
    title: 'First School Leaving Certificate',
    badge: 'Primary 6 / JS1 Entry',
    levelTarget: 'Primary 6',
    description: 'For Primary 6 learners preparing for Common Entrance & secondary school transition. Content is being rebuilt using verified official NERDC curriculum documents.',
    subjects: []
  },
  {
    id: 'bece',
    title: 'Basic Education Certificate Exam',
    badge: 'JSS 3 / Junior WAEC',
    levelTarget: 'JSS 3',
    description: 'For JSS 3 students preparing for Junior WAEC and Senior Secondary placement. Content is being rebuilt using verified official NERDC curriculum documents.',
    subjects: []
  },
  {
    id: 'waec',
    title: 'WAEC (SSCE) Senior Secondary',
    badge: 'SS3 / SSCE Exam',
    levelTarget: 'SS 3',
    description: 'For SS3 candidates preparing for the West African Senior School Certificate Examination. Content is being rebuilt using verified official NERDC curriculum documents.',
    subjects: []
  }
];

// Alias for backward compatibility
export const examRevisionData = EXAM_REVISION_DATA;

// Helper functions
export const getExamTypeById = (id: 'fslc' | 'bece' | 'waec'): ExamType | undefined => {
  return EXAM_REVISION_DATA.find((exam) => exam.id === id);
};

export const getQuestionsForTopic = (examId: string, subjectId: string, topicId: string): ExamQuestion[] => {
  const exam = EXAM_REVISION_DATA.find((e) => e.id === examId);
  if (!exam) return [];
  const subject = exam.subjects.find((s) => s.id === subjectId);
  if (!subject) return [];
  const topic = subject.topics.find((t) => t.id === topicId);
  return topic ? topic.questions : [];
};
