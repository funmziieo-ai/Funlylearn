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

export const EXAM_REVISION_DATA: ExamType[] = [
  // ==========================================
  // 1. FSLC (PRIMARY 6 COMMON ENTRANCE)
  // ==========================================
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
            name: 'Place Value, Fractions & Commercial Arithmetic',
            nerdcUnit: 'NERDC Primary 6 Modules 1, 3 & 8',
            objectives: [
              'Identify place values up to millions in whole numbers and decimals.',
              'Convert decimals to fractions and solve word problems involving Naira.',
              'Calculate percentages, simple interest, profit and ratio sharing.'
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
              },
              {
                id: 'fslc-m1-q4',
                question: 'Find the Least Common Multiple (LCM) of 12, 18, and 24.',
                options: ['A) 36', 'B) 48', 'C) 72', 'D) 144'],
                correctOptionIndex: 2,
                explanation: 'Multiples of 12: 12,24,36,48,60,72. Multiples of 18: 18,36,54,72. Multiples of 24: 24,48,72. The lowest common multiple is 72.'
              },
              {
                id: 'fslc-m1-q5',
                question: 'Find the Highest Common Factor (HCF) of 36 and 54.',
                options: ['A) 6', 'B) 9', 'C) 18', 'D) 27'],
                correctOptionIndex: 2,
                explanation: 'Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Factors of 54: 1, 2, 3, 6, 9, 18, 27, 54. Highest shared factor is 18.'
              },
              {
                id: 'fslc-m1-q6',
                question: 'Convert 3/5 into a percentage.',
                options: ['A) 35%', 'B) 50%', 'C) 60%', 'D) 75%'],
                correctOptionIndex: 2,
                explanation: '(3 / 5) × 100% = 3 × 20% = 60%.'
              },
              {
                id: 'fslc-m1-q7',
                question: 'Express 45% as a fraction in its simplest form.',
                options: ['A) 45/100', 'B) 9/20', 'C) 9/10', 'D) 4/5'],
                correctOptionIndex: 1,
                explanation: '45/100 divided by 5/5 = 9/20.'
              },
              {
                id: 'fslc-m1-q8',
                question: 'Share ₦15,000 between Titi and Chidi in the ratio 2 : 3. What is Chidi\'s share?',
                options: ['A) ₦3,000', 'B) ₦6,000', 'C) ₦9,000', 'D) ₦10,000'],
                correctOptionIndex: 2,
                explanation: 'Total parts = 2 + 3 = 5. Chidi gets (3/5) × ₦15,000 = ₦9,000.'
              },
              {
                id: 'fslc-m1-q9',
                question: 'Find the simple interest on ₦20,000 for 2 years at 5% per annum.',
                options: ['A) ₦1,000', 'B) ₦2,000', 'C) ₦2,500', 'D) ₦4,000'],
                correctOptionIndex: 1,
                explanation: 'Simple Interest = (P × R × T) / 100 = (20,000 × 5 × 2) / 100 = ₦2,000.'
              },
              {
                id: 'fslc-m1-q10',
                question: 'What is the Roman Numeral for 94?',
                options: ['A) LXXXXIV', 'B) XCIV', 'C) CXIV', 'D) CIV'],
                correctOptionIndex: 1,
                explanation: '90 is XC (100 - 10) and 4 is IV. Combining them gives XCIV.'
              },
              {
                id: 'fslc-m1-q11',
                question: 'Evaluate: 4/7 ÷ 8/21',
                options: ['A) 1/2', 'B) 1 1/2', 'C) 32/147', 'D) 2/3'],
                correctOptionIndex: 1,
                explanation: 'Invert second fraction and multiply: (4/7) × (21/8) = (4×21)/(7×8) = 84/56 = 3/2 = 1 1/2.'
              },
              {
                id: 'fslc-m1-q12',
                question: 'Rounding off 84,567 to the nearest hundred gives:',
                options: ['A) 84,500', 'B) 84,600', 'C) 85,000', 'D) 84,000'],
                correctOptionIndex: 1,
                explanation: 'The tens digit is 6 (5 or more), so we round up the hundreds digit 5 to 6, giving 84,600.'
              },
              {
                id: 'fslc-m1-q13',
                question: 'Find the average (mean) of 14, 18, 22, and 26.',
                options: ['A) 18', 'B) 20', 'C) 22', 'D) 80'],
                correctOptionIndex: 1,
                explanation: 'Sum = 14 + 18 + 22 + 26 = 80. Average = 80 / 4 = 20.'
              },
              {
                id: 'fslc-m1-q14',
                question: 'If 8 exercise books cost ₦2,400, how much will 5 exercise books cost?',
                options: ['A) ₦1,200', 'B) ₦1,500', 'C) ₦1,800', 'D) ₦2,000'],
                correctOptionIndex: 1,
                explanation: '1 book = ₦2,400 / 8 = ₦300. 5 books = ₦300 × 5 = ₦1,500.'
              },
              {
                id: 'fslc-m1-q15',
                question: 'Find the perimeter of a rectangle with length 12cm and width 8cm.',
                options: ['A) 20cm', 'B) 40cm', 'C) 96cm', 'D) 48cm'],
                correctOptionIndex: 1,
                explanation: 'Perimeter = 2 × (length + width) = 2 × (12 + 8) = 2 × 20 = 40cm.'
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
            name: 'Grammar, Concord & Vocabulary',
            nerdcUnit: 'NERDC Primary 6 Modules 1 & 4',
            objectives: [
              'Apply correct subject-verb agreement and tenses.',
              'Identify prepositions, adverbs, and collective nouns.',
              'Demonstrate understanding of synonyms and antonyms.'
            ],
            questions: [
              {
                id: 'fslc-e1-q1',
                question: 'Choose the word nearest in meaning to "INDUSTRIOUS" in the sentence: "The industrious pupil passed her exam."',
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
              },
              {
                id: 'fslc-e1-q3',
                question: 'Neither the teacher nor the students ____ present at the hall yesterday.',
                options: ['A) is', 'B) are', 'C) was', 'D) were'],
                correctOptionIndex: 3,
                explanation: 'When using "neither... nor", the verb agrees with the closer subject ("students", plural past = "were").'
              },
              {
                id: 'fslc-e1-q4',
                question: 'Choose the correct preposition: She has been living in Lagos ____ 2018.',
                options: ['A) for', 'B) since', 'C) from', 'D) at'],
                correctOptionIndex: 1,
                explanation: 'Use "since" for a specific point in time in the past.'
              },
              {
                id: 'fslc-e1-q5',
                question: 'Identify the adverb in: "The goalkeeper reacted quickly to save the penalty."',
                options: ['A) goalkeeper', 'B) reacted', 'C) quickly', 'D) penalty'],
                correctOptionIndex: 2,
                explanation: '"Quickly" is an adverb modifying the verb "reacted".'
              },
              {
                id: 'fslc-e1-q6',
                question: 'Which of these is a collective noun?',
                options: ['A) Honesty', 'B) Flock', 'C) Beautiful', 'D) Dancing'],
                correctOptionIndex: 1,
                explanation: '"Flock" is a collective noun referring to a group of sheep or birds.'
              },
              {
                id: 'fslc-e1-q7',
                question: 'Complete the sentence: The cake was shared ____ the four children.',
                options: ['A) between', 'B) among', 'C) with', 'D) in'],
                correctOptionIndex: 1,
                explanation: 'Use "among" when dealing with more than two individuals.'
              },
              {
                id: 'fslc-e1-q8',
                question: 'What is the comparative form of the adjective "Bad"?',
                options: ['A) Badder', 'B) Baddest', 'C) Worse', 'D) Worst'],
                correctOptionIndex: 2,
                explanation: 'Irregular adjective: Bad -> Worse (comparative) -> Worst (superlative).'
              },
              {
                id: 'fslc-e1-q9',
                question: 'This book belongs to Obi and me; it is ____.',
                options: ['A) ours', 'B) our', 'C) mine', 'D) theirs'],
                correctOptionIndex: 0,
                explanation: '"Ours" is the possessive pronoun for "Obi and me".'
              },
              {
                id: 'fslc-e1-q10',
                question: 'Choose the correct article: He is ____ honest man.',
                options: ['A) a', 'B) an', 'C) the', 'D) no article needed'],
                correctOptionIndex: 1,
                explanation: 'Honest has a silent "h", producing a vowel sound ("on-est"), requiring "an".'
              },
              {
                id: 'fslc-e1-q11',
                question: 'Identify the passive voice of: "Mama Titi cooked the delicious soup."',
                options: [
                  'A) Mama Titi was cooking delicious soup.',
                  'B) The delicious soup was cooked by Mama Titi.',
                  'C) Mama Titi cooks delicious soup.',
                  'D) The delicious soup is being cooked by Mama Titi.'
                ],
                correctOptionIndex: 1,
                explanation: 'In passive voice, object ("The delicious soup") becomes subject + past verb ("was cooked") + agent ("by Mama Titi").'
              },
              {
                id: 'fslc-e1-q12',
                question: 'Choose the correct plural form of "Child":',
                options: ['A) Childs', 'B) Children', 'C) Childrens', 'D) Childes'],
                correctOptionIndex: 1,
                explanation: 'The plural of "child" is "children".'
              },
              {
                id: 'fslc-e1-q13',
                question: 'Which word in the sentence is a conjunction? "I wanted to play outside, but it started raining."',
                options: ['A) wanted', 'B) outside', 'C) but', 'D) raining'],
                correctOptionIndex: 2,
                explanation: '"But" is a conjunction joining two independent clauses.'
              },
              {
                id: 'fslc-e1-q14',
                question: 'Choose the correct word: The headmaster gave us good ____.',
                options: ['A) advise', 'B) advice', 'C) advises', 'D) advices'],
                correctOptionIndex: 1,
                explanation: '"Advice" is an uncountable noun. "Advise" is a verb.'
              },
              {
                id: 'fslc-e1-q15',
                question: 'Choose the correct question tag: You are coming to school today, ____?',
                options: ['A) are you', 'B) aren\'t you', 'C) isn\'t it', 'D) don\'t you'],
                correctOptionIndex: 1,
                explanation: 'A positive statement ("You are...") takes a negative question tag ("aren\'t you?").'
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // 2. BECE (JSS 3 JUNIOR WAEC)
  // ==========================================
  {
    id: 'bece',
    title: 'Basic Education Certificate Exam',
    badge: 'JSS 3 / Junior WAEC',
    levelTarget: 'JSS 3',
    description: 'For JSS 3 students preparing for Junior WAEC and Senior Secondary placement.',
    subjects: [
      {
        id: 'bece-sci',
        name: 'Basic Science & Technology',
        icon: '🔬',
        topics: [
          {
            id: 'bece-s-1',
            name: 'Living Things, Energy & Matter',
            nerdcUnit: 'NERDC JSS3 Science Theme 1 & 2',
            objectives: [
              'Identify human organs, nutrition, and disease vectors.',
              'Explain basic energy transformations, forces, and simple machines.',
              'Understand states of matter and physical/chemical changes.'
            ],
            questions: [
              {
                id: 'bece-s1-q1',
                question: 'Which vector is responsible for transmitting the Malaria parasite to humans?',
                options: ['A) Housefly', 'B) Female Anopheles Mosquito', 'C) Tsetse fly', 'D) Blackfly'],
                correctOptionIndex: 1,
                explanation: 'The female Anopheles mosquito transmits Plasmodium parasite causing Malaria.'
              },
              {
                id: 'bece-s1-q2',
                question: 'Which nutrient is primarily responsible for tissue repair and growth in the body?',
                options: ['A) Carbohydrates', 'B) Proteins', 'C) Fats & Oils', 'D) Vitamins'],
                correctOptionIndex: 1,
                explanation: 'Proteins are essential for building muscle and tissue repair.'
              },
              {
                id: 'bece-s1-q3',
                question: 'Which of the following is a water-borne disease?',
                options: ['A) Malaria', 'B) Cholera', 'C) Measles', 'D) Tuberculosis'],
                correctOptionIndex: 1,
                explanation: 'Cholera is transmitted through contaminated drinking water.'
              },
              {
                id: 'bece-s1-q4',
                question: 'What is the green pigment in plant leaves that absorbs sunlight for photosynthesis?',
                options: ['A) Stomata', 'B) Chlorophyll', 'C) Xylem', 'D) Epidermis'],
                correctOptionIndex: 1,
                explanation: 'Chlorophyll traps sunlight for photosynthesis.'
              },
              {
                id: 'bece-s1-q5',
                question: 'The process by which living organisms produce offspring of their own kind is:',
                options: ['A) Respiration', 'B) Excretion', 'C) Reproduction', 'D) Digestion'],
                correctOptionIndex: 2,
                explanation: 'Reproduction ensures continuation of species.'
              },
              {
                id: 'bece-s1-q6',
                question: 'Which component of blood defends the body against infections?',
                options: ['A) Red Blood Cells', 'B) White Blood Cells', 'C) Platelets', 'D) Plasma'],
                correctOptionIndex: 1,
                explanation: 'White Blood Cells form part of the immune system.'
              },
              {
                id: 'bece-s1-q7',
                question: 'Scurvy is caused by a deficiency of which vitamin?',
                options: ['A) Vitamin A', 'B) Vitamin C', 'C) Vitamin D', 'D) Vitamin K'],
                correctOptionIndex: 1,
                explanation: 'Lack of Vitamin C causes bleeding gums (Scurvy).'
              },
              {
                id: 'bece-s1-q8',
                question: 'In the human digestive system, protein digestion starts in the:',
                options: ['A) Mouth', 'B) Stomach', 'C) Small Intestine', 'D) Large Intestine'],
                correctOptionIndex: 1,
                explanation: 'Stomach enzymes (pepsin) begin breaking down proteins.'
              },
              {
                id: 'bece-s1-q9',
                question: 'Which organ filters liquid waste from blood to form urine?',
                options: ['A) Liver', 'B) Kidney', 'C) Lungs', 'D) Pancreas'],
                correctOptionIndex: 1,
                explanation: 'Kidneys filter urea and excess fluids into urine.'
              },
              {
                id: 'bece-s1-q10',
                question: 'Which state of matter has a fixed volume but no fixed shape?',
                options: ['A) Solid', 'B) Liquid', 'C) Gas', 'D) Plasma'],
                correctOptionIndex: 1,
                explanation: 'Liquids conform to the container shape while maintaining volume.'
              },
              {
                id: 'bece-s1-q11',
                question: 'Which simple machine is an inclined plane wrapped around a cylinder?',
                options: ['A) Lever', 'B) Pulley', 'C) Screw', 'D) Wheel & Axle'],
                correctOptionIndex: 2,
                explanation: 'A screw is a spiral inclined plane.'
              },
              {
                id: 'bece-s1-q12',
                question: 'What form of energy is stored in a chemical battery?',
                options: ['A) Solar Energy', 'B) Chemical Energy', 'C) Heat Energy', 'D) Light Energy'],
                correctOptionIndex: 1,
                explanation: 'Batteries store chemical energy that converts to electrical current.'
              },
              {
                id: 'bece-s1-q13',
                question: 'Which of these materials is an electrical conductor?',
                options: ['A) Rubber', 'B) Dry Wood', 'C) Copper Wire', 'D) Plastic'],
                correctOptionIndex: 2,
                explanation: 'Copper is a good electrical conductor.'
              },
              {
                id: 'bece-s1-q14',
                question: 'Light travels in ____ lines.',
                options: ['A) Curved', 'B) Zig-zag', 'C) Straight', 'D) Circular'],
                correctOptionIndex: 2,
                explanation: 'Rectilinear propagation dictates light travels in straight lines.'
              },
              {
                id: 'bece-s1-q15',
                question: 'What instrument is used to measure human body temperature?',
                options: ['A) Barometer', 'B) Thermometer', 'C) Hygrometer', 'D) Anemometer'],
                correctOptionIndex: 1,
                explanation: 'A clinical thermometer measures temperature.'
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // 3. WAEC (SS3 SENIOR SECONDARY)
  // ==========================================
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
            name: 'Number Bases, Algebra & Calculus',
            nerdcUnit: 'NERDC SS3 Math Topics 1, 3 & 8',
            objectives: [
              'Convert between number bases and evaluate modular arithmetic.',
              'Solve simultaneous and quadratic equations.',
              'Apply differentiation and integration fundamentals.'
            ],
            questions: [
              {
                id: 'waec-m1-q1',
                question: 'Convert 11011_two to a number in Base 10.',
                options: ['A) 25', 'B) 27', 'C) 31', 'D) 23'],
                correctOptionIndex: 1,
                explanation: 'Correct! 11011_two = (1×16) + (1×8) + (0×4) + (1×2) + (1×1) = 27.'
              },
              {
                id: 'waec-m1-q2',
                question: 'Evaluate (14 × 9) mod 5 in modular arithmetic.',
                options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
                correctOptionIndex: 0,
                explanation: 'Correct! 14 × 9 = 126. 126 ÷ 5 gives remainder 1. So 126 mod 5 = 1.'
              },
              {
                id: 'waec-m1-q3',
                question: 'If 32_x = 23_ten, find the base x.',
                options: ['A) 5', 'B) 6', 'C) 7', 'D) 8'],
                correctOptionIndex: 2,
                explanation: 'Correct! 32_x = 3x + 2 = 23 => 3x = 21 => x = 7.'
              },
              {
                id: 'waec-m1-q4',
                question: 'Find the roots of the quadratic equation x² - 7x + 12 = 0.',
                options: ['A) x = 3, 4', 'B) x = -3, -4', 'C) x = 2, 6', 'D) x = 1, 12'],
                correctOptionIndex: 0,
                explanation: 'Factorizing gives (x - 3)(x - 4) = 0 => x = 3 or x = 4.'
              },
              {
                id: 'waec-m1-q5',
                question: 'Find the derivative dy/dx of y = 4x³ - 5x² + 6x - 9.',
                options: ['A) 12x² - 10x + 6', 'B) 4x² - 5x + 6', 'C) 12x³ - 10x²', 'D) 3x² - 2x + 1'],
                correctOptionIndex: 0,
                explanation: 'Using power rule: d/dx(4x³) = 12x², d/dx(-5x²) = -10x, d/dx(6x) = 6.'
              },
              {
                id: 'waec-m1-q6',
                question: 'Convert 43_five to base 10.',
                options: ['A) 21', 'B) 23', 'C) 25', 'D) 20'],
                correctOptionIndex: 1,
                explanation: '43_five = (4 × 5¹) + (3 × 5⁰) = 20 + 3 = 23.'
              },
              {
                id: 'waec-m1-q7',
                question: 'Solve for x if 2x + 5 = 15.',
                options: ['A) 10', 'B) 5', 'C) 7.5', 'D) 4'],
                correctOptionIndex: 1,
                explanation: '2x = 15 - 5 => 2x = 10 => x = 5.'
              },
              {
                id: 'waec-m1-q8',
                question: 'What is the sum of interior angles of a 6-sided polygon (hexagon)?',
                options: ['A) 360°', 'B) 540°', 'C) 720°', 'D) 900°'],
                correctOptionIndex: 2,
                explanation: 'Sum = (n - 2) × 180° = (6 - 2) × 180° = 4 × 180° = 720°.'
              },
              {
                id: 'waec-m1-q9',
                question: 'Solve for x: 3^(x+1) = 81.',
                options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
                correctOptionIndex: 2,
                explanation: '3^(x+1) = 3⁴ => x + 1 = 4 => x = 3.'
              },
              {
                id: 'waec-m1-q10',
                question: 'Evaluate log10(1000).',
                options: ['A) 2', 'B) 3', 'C) 4', 'D) 10'],
                correctOptionIndex: 1,
                explanation: '10³ = 1000, so log10(1000) = 3.'
              },
              {
                id: 'waec-m1-q11',
                question: 'Factorize completely: x² - 16.',
                options: ['A) (x - 4)²', 'B) (x - 4)(x + 4)', 'C) (x + 4)²', 'D) (x - 16)(x + 1)'],
                correctOptionIndex: 1,
                explanation: 'Difference of two squares: a² - b² = (a - b)(a + b).'
              },
              {
                id: 'waec-m1-q12',
                question: 'Find the gradient of the curve y = 3x² at the point where x = 2.',
                options: ['A) 6', 'B) 8', 'C) 12', 'D) 18'],
                correctOptionIndex: 2,
                explanation: 'dy/dx = 6x. At x = 2, gradient = 6 × 2 = 12.'
              },
              {
                id: 'waec-m1-q13',
                question: 'Evaluate the integral ∫ 2x dx.',
                options: ['A) x² + C', 'B) 2x² + C', 'C) x² / 2 + C', 'D) 2 + C'],
                correctOptionIndex: 0,
                explanation: '∫ 2x dx = 2 × (x² / 2) + C = x² + C.'
              },
              {
                id: 'waec-m1-q14',
                question: 'What is the probability of rolling an even number on a fair 6-sided die?',
                options: ['A) 1/6', 'B) 1/2', 'C) 1/3', 'D) 2/3'],
                correctOptionIndex: 1,
                explanation: 'Even numbers = {2, 4, 6} (3 outcomes out of 6). Probability = 3/6 = 1/2.'
              },
              {
                id: 'waec-m1-q15',
                question: 'If tan(θ) = 1, find the acute angle θ in degrees.',
                options: ['A) 30°', 'B) 45°', 'C) 60°', 'D) 90°'],
                correctOptionIndex: 1,
                explanation: 'tan(45°) = 1.'
              }
            ]
          }
        ]
      }
    ]
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
