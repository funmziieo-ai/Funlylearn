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
  id: 'fslc' | 'waec';
  title: string;
  badge: string;
  levelTarget: string;
  description: string;
  subjects: ExamSubject[];
}

export const EXAM_REVISION_DATA: ExamType[] = [
  {
    id: 'fslc',
    title: 'First School Leaving Certificate',
    badge: 'Primary 6 / JS1 Entry',
    levelTarget: 'Primary 6',
    description: 'For Primary 6 learners preparing for Common Entrance & secondary school transition.',
    subjects: [
      {
        id: 'fslc-math',
        name: 'Mathematics',
        icon: '📐',
        topics: [
          {
            id: 'fslc-m-1',
            name: 'Place Value, Whole Numbers & Decimals',
            nerdcUnit: 'NERDC Primary 6 Module 1',
            objectives: [
              'Identify place values up to millions in whole numbers and decimals.',
              'Convert decimals to fractions and solve word problems involving local currency (Naira).',
              'Apply standard NERDC place value concepts to real-world commercial transactions.'
            ],
            questions: [
              {
                id: 'fslc-m1-q1',
                question: 'In the number 7,842,510, what is the place value of the digit 8?',
                options: ['A) Tens of Thousands', 'B) Hundreds of Thousands', 'C) Millions', 'D) Thousands'],
                correctOptionIndex: 1,
                explanation: 'Correct! The digit 8 represents 800,000, which is in the Hundreds of Thousands position.'
              },
              {
                id: 'fslc-m1-q2',
                question: 'Express 0.75 as a simplified fraction.',
                options: ['A) 1/2', 'B) 3/4', 'C) 2/5', 'D) 7/10'],
                correctOptionIndex: 1,
                explanation: 'Correct! 0.75 = 75/100. Dividing both numerator and denominator by 25 yields 3/4.'
              },
              {
                id: 'fslc-m1-q3',
                question: 'Mama Titi bought 4 crates of eggs at ₦2,500 per crate. If she paid with a ₦10,000 note, how much change should she receive?',
                options: ['A) ₦1,000', 'B) ₦500', 'C) ₦0 (Exact payment)', 'D) ₦2,000'],
                correctOptionIndex: 2,
                explanation: 'Correct! 4 × ₦2,500 = ₦10,000. Since she paid exactly ₦10,000, no change is required.'
              }
            ]
          },
          {
            id: 'fslc-m-2',
            name: 'Fractions, Percentages & Ratio',
            nerdcUnit: 'NERDC Primary 6 Module 3',
            objectives: [
              'Calculate percentages of quantities and express fractions as percentages.',
              'Divide quantities into given ratios for sharing items fairly.',
              'Solve NERDC standard word problems on profit margin and fractions.'
            ],
            questions: [
              {
                id: 'fslc-m2-q1',
                question: 'What is 20% of ₦15,000?',
                options: ['A) ₦3,000', 'B) ₦2,500', 'C) ₦1,500', 'D) ₦300'],
                correctOptionIndex: 0,
                explanation: 'Correct! (20 / 100) × ₦15,000 = ₦3,000.'
              },
              {
                id: 'fslc-m2-q2',
                question: 'Share ₦50,000 between Tayo and Obi in the ratio 2 : 3. How much does Obi get?',
                options: ['A) ₦20,000', 'B) ₦30,000', 'C) ₦25,000', 'D) ₦15,000'],
                correctOptionIndex: 1,
                explanation: 'Correct! Total ratio parts = 2 + 3 = 5. Obi\'s share = (3 / 5) × ₦50,000 = ₦30,000.'
              }
            ]
          },
          {
            id: 'fslc-m-3',
            name: 'Simple Interest & Money Calculations',
            nerdcUnit: 'NERDC Primary 6 Module 8',
            objectives: [
              'Calculate Simple Interest using the formula I = (P × R × T) / 100.',
              'Determine Principal, Rate, or Time in savings and loans.',
              'Solve practical cooperative banking and market interest problems.'
            ],
            questions: [
              {
                id: 'fslc-m3-q1',
                question: 'Calculate the Simple Interest on ₦20,000 deposited at 5% per annum for 2 years.',
                options: ['A) ₦1,000', 'B) ₦2,000', 'C) ₦500', 'D) ₦4,000'],
                correctOptionIndex: 1,
                explanation: 'Correct! Interest = (20,000 × 5 × 2) / 100 = ₦2,000.'
              }
            ]
          }
        ]
      },
      {
        id: 'fslc-eng',
        name: 'English Language',
        icon: '📖',
        topics: [
          {
            id: 'fslc-e-1',
            name: 'Comprehension & Vocabulary Building',
            nerdcUnit: 'NERDC Primary 6 English Module 1',
            objectives: [
              'Extract main ideas and specific facts from passage contexts.',
              'Identify synonyms and antonyms of underlined words in sentences.',
              'Understand contextual meanings of Nigerian folk metaphors.'
            ],
            questions: [
              {
                id: 'fslc-e1-q1',
                question: 'Choose the word nearest in meaning to "INDUSTRIOUS" in the sentence: "The industrious pupil passed all her exams."',
                options: ['A) Lazy', 'B) Hardworking', 'C) Clever', 'D) Quiet'],
                correctOptionIndex: 1,
                explanation: 'Correct! "Industrious" means diligent and hardworking.'
              },
              {
                id: 'fslc-e1-q2',
                question: 'Choose the opposite in meaning to "ANCIENT" in: "We visited an ancient village near Ibadan."',
                options: ['A) Old', 'B) Historic', 'C) Modern', 'D) Traditional'],
                correctOptionIndex: 2,
                explanation: 'Correct! The antonym of "ancient" (very old) is "modern".'
              }
            ]
          },
          {
            id: 'fslc-e-2',
            name: 'Parts of Speech & Tenses',
            nerdcUnit: 'NERDC Primary 6 English Module 4',
            objectives: [
              'Identify proper nouns, adverbs, and conjunctions in passages.',
              'Use present, past, and future perfect tenses correctly in sentences.',
              'Maintain correct subject-verb agreement (concord).'
            ],
            questions: [
              {
                id: 'fslc-e2-q1',
                question: 'Identify the adverb in: "The goalkeeper reacted quickly to save the penalty."',
                options: ['A) goalkeeper', 'B) reacted', 'C) quickly', 'D) penalty'],
                correctOptionIndex: 2,
                explanation: 'Correct! "Quickly" modifies the verb "reacted" and tells us how he reacted.'
              }
            ]
          }
        ]
      },
      {
        id: 'fslc-sci',
        name: 'Basic Science & Technology',
        icon: '🔬',
        topics: [
          {
            id: 'fslc-s-1',
            name: 'Living Things & Environmental Health',
            nerdcUnit: 'NERDC Primary 6 Science Theme 1',
            objectives: [
              'Distinguish between characteristics of plants, animals, and non-living objects.',
              'Explain methods of water purification and proper waste disposal.',
              'Identify causes and preventions of common local diseases like Malaria and Typhoid.'
            ],
            questions: [
              {
                id: 'fslc-s1-q1',
                question: 'Which vector is responsible for transmitting the Malaria parasite to humans?',
                options: ['A) Housefly', 'B) Female Anopheles Mosquito', 'C) Tsetse fly', 'D) Blackfly'],
                correctOptionIndex: 1,
                explanation: 'Correct! The female Anopheles mosquito transmits Plasmodium parasite causing Malaria.'
              }
            ]
          }
        ]
      },
      {
        id: 'fslc-[#FF6B35]',
        name: 'Yoruba Language & Culture',
        icon: '🇳🇬',
        topics: [
          {
            id: 'fslc-y-1',
            name: 'Ikini atiba Asa Yoruba (Greetings & Customs)',
            nerdcUnit: 'NERDC Primary 6 Yoruba Theme 1',
            objectives: [
              'Identify appropriate Yoruba traditional greetings for various times and occasions.',
              'Understand respect customs (Dobaale & Yikun) in Yoruba culture.',
              'Explain the cultural significance of traditional names and naming ceremonies.'
            ],
            questions: [
              {
                id: 'fslc-y1-q1',
                question: 'Kí ni ìkíni tí a máa ń kí egbẹ́ rẹ tàbí àgbà ní òwúrọ̀ ní èdè Yorùbá?',
                options: ['A) Ẹ kú àálẹ́', 'B) Ẹ ku àárọ̀', 'C) Ẹ kú ọ̀sán', 'D) Ẹ kú iṣẹ́'],
                correctOptionIndex: 1,
                explanation: 'Correct! "Ẹ ku àárọ̀" is the proper Yoruba morning greeting.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'waec',
    title: 'WAEC (SSCE) Senior Secondary',
    badge: 'SS3 / SSCE Exam',
    levelTarget: 'SS 3',
    description: 'For SS3 candidates preparing for the West African Senior School Certificate Examination.',
    subjects: [
      {
        id: 'waec-math',
        name: 'Mathematics (General)',
        icon: '📐',
        topics: [
          {
            id: 'waec-m-1',
            name: 'Number Bases & Modular Arithmetic',
            nerdcUnit: 'NERDC SS3 Math Topic 1',
            objectives: [
              'Convert fluently between Base 10, Base 2, Base 5, and Base 8 numbers.',
              'Perform operations (+, -, ×) in modular arithmetic.',
              'Solve WAEC past objective and theory questions on number systems.'
            ],
            questions: [
              {
                id: 'waec-m1-q1',
                question: 'Convert 11011_two to a number in Base 10.',
                options: ['A) 25', 'B) 27', 'C) 31', 'D) 23'],
                correctOptionIndex: 1,
                explanation: 'Correct! 11011_two = (1×16) + (1×8) + (0×4) + (1×2) + (1×1) = 16 + 8 + 0 + 2 + 1 = 27.'
              },
              {
                id: 'waec-m1-q2',
                question: 'Evaluate (14 × 9) mod 5 in modular arithmetic.',
                options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
                correctOptionIndex: 0,
                explanation: 'Correct! 14 × 9 = 126. Dividing 126 by 5 leaves a remainder of 1. Hence 126 mod 5 = 1.'
              },
              {
                id: 'waec-m1-q3',
                question: 'If 32_x = 23_ten, find the base x.',
                options: ['A) 5', 'B) 6', 'C) 7', 'D) 8'],
                correctOptionIndex: 2,
                explanation: 'Correct! 32_x = 3x + 2 = 23 ⇒ 3x = 21 ⇒ x = 7.'
              }
            ]
          },
          {
            id: 'waec-m-2',
            name: 'Algebra: Simultaneous & Quadratic Equations',
            nerdcUnit: 'NERDC SS3 Math Topic 3',
            objectives: [
              'Solve simultaneous linear and quadratic equations algebraically.',
              'Apply the quadratic formula x = (-b ± √(b² - 4ac)) / 2a accurately.',
              'Formulate word problems into quadratic models.'
            ],
            questions: [
              {
                id: 'waec-m2-q1',
                question: 'Find the roots of the quadratic equation x² - 7x + 12 = 0.',
                options: ['A) x = 3, 4', 'B) x = -3, -4', 'C) x = 2, 6', 'D) x = 1, 12'],
                correctOptionIndex: 0,
                explanation: 'Correct! (x - 3)(x - 4) = 0 ⇒ x = 3 or x = 4.'
              }
            ]
          },
          {
            id: 'waec-m-3',
            name: 'Calculus: Differentiation & Integration',
            nerdcUnit: 'NERDC SS3 Math Topic 8',
            objectives: [
              'Find derivatives of polynomial functions using the power rule d/dx(x^n) = n·x^(n-1).',
              'Determine turning points (maxima/minima) of curves.',
              'Evaluate definite integrals to calculate areas under curves.'
            ],
            questions: [
              {
                id: 'waec-m3-q1',
                question: 'Find the derivative dy/dx of y = 4x³ - 5x² + 6x - 9.',
                options: ['A) 12x² - 10x + 6', 'B) 4x² - 5x + 6', 'C) 12x³ - 10x²', 'D) 3x² - 2x + 1'],
                correctOptionIndex: 0,
                explanation: 'Correct! d/dx(4x³) = 12x², d/dx(-5x²) = -10x, d/dx(6x) = 6, d/dx(-9) = 0.'
              }
            ]
          }
        ]
      },
      {
        id: 'waec-phy',
        name: 'Physics',
        icon: '⚡',
        topics: [
          {
            id: 'waec-p-1',
            name: 'Motion, Velocity & Acceleration',
            nerdcUnit: 'NERDC SS3 Physics Topic 1',
            objectives: [
              'Apply equations of uniformly accelerated motion: v = u + at, s = ut + ½at², v² = u² + 2as.',
              'Interpret distance-time and velocity-time graphs.',
              'Solve trajectory and free-fall gravity calculations.'
            ],
            questions: [
              {
                id: 'waec-p1-q1',
                question: 'A car accelerates uniformly from rest at 3 m/s² for 8 seconds. Calculate the final velocity reached.',
                options: ['A) 24 m/s', 'B) 12 m/s', 'C) 96 m/s', 'D) 18 m/s'],
                correctOptionIndex: 0,
                explanation: 'Correct! v = u + at = 0 + (3 × 8) = 24 m/s.'
              }
            ]
          }
        ]
      },
      {
        id: 'waec-chem',
        name: 'Chemistry',
        icon: '🧪',
        topics: [
          {
            id: 'waec-c-1',
            name: 'Atomic Structure & Mole Concept',
            nerdcUnit: 'NERDC SS3 Chemistry Topic 2',
            objectives: [
              'Calculate molar masses and determine number of moles in given masses.',
              'Write electronic configurations of elements from atomic number 1 to 30.',
              'Apply Avogadro\'s law and stoichiometry to chemical equations.'
            ],
            questions: [
              {
                id: 'waec-c1-q1',
                question: 'Calculate the number of moles present in 88 grams of Carbon Dioxide (CO₂). [C = 12, O = 16]',
                options: ['A) 1.0 mole', 'B) 2.0 moles', 'C) 0.5 moles', 'D) 4.0 moles'],
                correctOptionIndex: 1,
                explanation: 'Correct! Molar mass of CO₂ = 12 + (2 × 16) = 44 g/mol. Moles = 88 / 44 = 2.0 moles.'
              }
            ]
          }
        ]
      },
      {
        id: 'waec-bio',
        name: 'Biology',
        icon: '🧬',
        topics: [
          {
            id: 'waec-b-1',
            name: 'Genetics, Heredity & Sickle Cell Trait',
            nerdcUnit: 'NERDC SS3 Biology Topic 4',
            objectives: [
              'Understand Mendel\'s Laws of Inheritance and Punnett Square crosses.',
              'Explain the genetics of Sickle Cell Anaemia alleles (AA, AS, SS) and blood groups.',
              'Analyze phenotypic ratios in genetic crosses.'
            ],
            questions: [
              {
                id: 'waec-b1-q1',
                question: 'If two carrier parents with genotype AS have a child, what is the probability of having a child with genotype SS?',
                options: ['A) 25% (1 in 4)', 'B) 50% (1 in 2)', 'C) 75% (3 in 4)', 'D) 0%'],
                correctOptionIndex: 0,
                explanation: 'Correct! AS × AS yields genotypes AA (25%), AS (50%), and SS (25%). So SS probability is 25%.'
              }
            ]
          }
        ]
      }
    ]
  }
];
