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
    description: 'For Primary 6 learners preparing for Common Entrance & secondary school transition. Mathematics is verified against the real official NERDC curriculum. Other subjects are being rebuilt the same way.',
    subjects: [
      {
        id: 'fslc-math',
        name: 'Mathematics',
        icon: '📐',
        topics: [
          {
            id: 'fslc-m-1',
            name: 'Fractions, Percentages & Commercial Arithmetic',
            nerdcUnit: 'NERDC Primary 6 Mathematics — Theme: Numbers and Numeration, Sub-Theme: Fractions (pp. 48-53); Theme: Mensuration and Geometry, Sub-Theme: Primary Measure — Money (pp. 59-61)',
            objectives: [
              'Simplify and convert fractions, and express fractions as percentages.',
              'Solve ratio and proportion problems, including sharing quantities in a given ratio.',
              'Solve money problems involving Naira, including calculating change and simple interest.'
            ],
            questions: [
              {
                id: 'fslc-m1-q1',
                question: 'Express 0.75 as a simplified fraction.',
                options: ['A) 1/2', 'B) 3/4', 'C) 2/5', 'D) 7/10'],
                correctOptionIndex: 1,
                explanation: 'Correct! 0.75 = 75/100. Dividing both numerator and denominator by 25 yields 3/4.'
              },
              {
                id: 'fslc-m1-q2',
                question: 'Mama Titi bought 4 crates of eggs at ₦2,500 per crate. If she paid with a ₦10,000 note, how much change should she receive?',
                options: ['A) ₦1,000', 'B) ₦500', 'C) ₦0 (Exact payment)', 'D) ₦2,000'],
                correctOptionIndex: 2,
                explanation: 'Correct! 4 × ₦2,500 = ₦10,000. Since she paid exactly ₦10,000, no change is required.'
              },
              {
                id: 'fslc-m1-q3',
                question: 'Convert 3/5 into a percentage.',
                options: ['A) 35%', 'B) 50%', 'C) 60%', 'D) 75%'],
                correctOptionIndex: 2,
                explanation: '(3 / 5) × 100% = 3 × 20% = 60%.'
              },
              {
                id: 'fslc-m1-q4',
                question: 'Express 45% as a fraction in its simplest form.',
                options: ['A) 45/100', 'B) 9/20', 'C) 9/10', 'D) 4/5'],
                correctOptionIndex: 1,
                explanation: '45/100 divided by 5/5 = 9/20.'
              },
              {
                id: 'fslc-m1-q5',
                question: 'Share ₦15,000 between Titi and Chidi in the ratio 2 : 3. What is Chidi\'s share?',
                options: ['A) ₦3,000', 'B) ₦6,000', 'C) ₦9,000', 'D) ₦10,000'],
                correctOptionIndex: 2,
                explanation: 'Total parts = 2 + 3 = 5. Chidi gets (3/5) × ₦15,000 = ₦9,000.'
              },
              {
                id: 'fslc-m1-q6',
                question: 'Evaluate: 4/7 ÷ 8/21',
                options: ['A) 1/2', 'B) 1 1/2', 'C) 32/147', 'D) 2/3'],
                correctOptionIndex: 1,
                explanation: 'Invert second fraction and multiply: (4/7) × (21/8) = (4×21)/(7×8) = 84/56 = 3/2 = 1 1/2.'
              },
              {
                id: 'fslc-m1-q7',
                question: 'If 8 exercise books cost ₦2,400, how much will 5 exercise books cost?',
                options: ['A) ₦1,200', 'B) ₦1,500', 'C) ₦1,800', 'D) ₦2,000'],
                correctOptionIndex: 1,
                explanation: '1 book = ₦2,400 / 8 = ₦300. 5 books = ₦300 × 5 = ₦1,500.'
              }
            ]
          },
          {
            id: 'fslc-m-2',
            name: 'Mensuration: Perimeter, Area & Measures',
            nerdcUnit: 'NERDC Primary 6 Mathematics — Theme: Mensuration and Geometry, Sub-Theme: Secondary Measures (pp. 62-64)',
            objectives: [
              'Calculate the perimeter and area of common plane shapes.',
              'Solve problems involving length, weight, and time conversions.'
            ],
            questions: [
              {
                id: 'fslc-m2-q1',
                question: 'Find the perimeter of a rectangle with length 12cm and width 8cm.',
                options: ['A) 20cm', 'B) 40cm', 'C) 96cm', 'D) 48cm'],
                correctOptionIndex: 1,
                explanation: 'Perimeter = 2 × (length + width) = 2 × (12 + 8) = 2 × 20 = 40cm.'
              }
            ]
          }
        ]
      }
    ]
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
