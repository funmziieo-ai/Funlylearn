import { CurriculumTopic } from '../types';

export const NERDC_CURRICULUM: CurriculumTopic[] = [
  // Primary 3
  {
    id: 'p3-math-1',
    classLevel: 'Primary 3',
    subject: 'Mathematics',
    topicName: 'Place Value & Whole Numbers up to 9,999',
    nerdcUnit: 'NERDC P3 Math Module 1',
    description: 'Understanding thousands, hundreds, tens, and units using Naira market examples.',
    keyConcepts: ['Thousands (Th)', 'Hundreds (H)', 'Tens (T)', 'Units (U)', 'Counting in 100s'],
    sampleQuestion: 'In 4,520 Naira, what digit is in the Hundreds position?'
  },
  {
    id: 'p3-math-2',
    classLevel: 'Primary 3',
    subject: 'Mathematics',
    topicName: 'Fractions (Halves, Quarters, Thirds)',
    nerdcUnit: 'NERDC P3 Math Module 4',
    description: 'Dividing bread, agege bread, or oranges into equal portions.',
    keyConcepts: ['Numerator', 'Denominator', 'Equivalent fractions'],
    sampleQuestion: 'If Mama Titi shares one Agege bread equally among 4 children, what fraction does each child get?'
  },
  {
    id: 'p3-sci-1',
    classLevel: 'Primary 3',
    subject: 'Basic Science',
    topicName: 'Living and Non-Living Things in Our Community',
    nerdcUnit: 'NERDC P3 Science Theme 1',
    description: 'Characteristics of plants, goats, soil, and motorcars around a Nigerian village or town.',
    keyConcepts: ['Movement', 'Respiration', 'Feeding', 'Growth'],
    sampleQuestion: 'Why is a goat considered a living thing, while a Danfo bus is non-living?'
  },

  // Primary 4
  {
    id: 'p4-math-1',
    classLevel: 'Primary 4',
    subject: 'Mathematics',
    topicName: 'Long Multiplication & Division of Whole Numbers',
    nerdcUnit: 'NERDC P4 Math Module 3',
    description: 'Multiplying 2-digit numbers by 1-digit numbers and sharing items evenly.',
    keyConcepts: ['Multiplicand', 'Product', 'Quotient', 'Remainder'],
    sampleQuestion: 'A trader buys 15 crates of eggs, each containing 30 eggs. How many eggs in total?'
  },
  {
    id: 'p4-eng-1',
    classLevel: 'Primary 4',
    subject: 'English Language',
    topicName: 'Nouns, Pronouns & Adjectives in Nigerian Stories',
    nerdcUnit: 'NERDC P4 English Module 2',
    description: 'Identifying proper nouns, collective nouns, and descriptive words in folklore.',
    keyConcepts: ['Proper Noun', 'Common Noun', 'Descriptive Adjective'],
    sampleQuestion: 'In the sentence "Tortoise ate the sweet pawpaw", which word is the adjective?'
  },

  // Primary 5
  {
    id: 'p5-math-1',
    classLevel: 'Primary 5',
    subject: 'Mathematics',
    topicName: 'Decimals, Percentages & Profit/Loss',
    nerdcUnit: 'NERDC P5 Math Module 6',
    description: 'Calculating percentage gain or loss in local market trade.',
    keyConcepts: ['Cost Price (CP)', 'Selling Price (SP)', 'Percentage Profit'],
    sampleQuestion: 'A merchant buys a bag of rice for 50,000 Naira and sells it for 60,000 Naira. Find the percentage profit.'
  },
  {
    id: 'p5-sci-1',
    classLevel: 'Primary 5',
    subject: 'Basic Science',
    topicName: 'Forces & Simple Machines',
    nerdcUnit: 'NERDC P5 Science Theme 3',
    description: 'Pulleys, inclined planes, and levers used in grinding mills or water wells.',
    keyConcepts: ['Fulcrum', 'Load', 'Effort', 'Friction'],
    sampleQuestion: 'How does a wheelbarrow make carrying heavy bags of cement easier?'
  },

  // Primary 6
  {
    id: 'p6-math-1',
    classLevel: 'Primary 6',
    subject: 'Mathematics',
    topicName: 'Simple Interest & Money Calculations',
    nerdcUnit: 'NERDC P6 Math Module 8',
    description: 'Principal, rate, and time calculations for cooperative bank savings.',
    keyConcepts: ['Principal (P)', 'Rate (R)', 'Time (T)', 'Simple Interest (I = PRT/100)'],
    sampleQuestion: 'Calculate the Simple Interest on 20,000 Naira deposited at 5% per annum for 2 years.'
  },

  // JSS 1
  {
    id: 'jss1-math-1',
    classLevel: 'JSS 1',
    subject: 'Mathematics',
    topicName: 'Algebraic Expressions & Simplification',
    nerdcUnit: 'NERDC JSS1 Math Theme 2',
    description: 'Combining like terms and using variables x and y in problem solving.',
    keyConcepts: ['Variables', 'Coefficients', 'Like terms', 'Simplification'],
    sampleQuestion: 'Simplify the algebraic expression: 4x + 3y + 2x - y.'
  },
  {
    id: 'jss1-sci-1',
    classLevel: 'JSS 1',
    subject: 'Basic Science',
    topicName: 'Matter, States of Matter & Kinetic Theory',
    nerdcUnit: 'NERDC JSS1 Science Theme 1',
    description: 'Solids, liquids, and gases in daily life like ice melting in palm wine or boiling water.',
    keyConcepts: ['Solid', 'Liquid', 'Gas', 'Evaporation', 'Condensation'],
    sampleQuestion: 'What happens to the molecules of water when it turns into steam?'
  },

  // JSS 2
  {
    id: 'jss2-math-1',
    classLevel: 'JSS 2',
    subject: 'Mathematics',
    topicName: 'Linear Equations & Expansion of Brackets',
    nerdcUnit: 'NERDC JSS2 Math Theme 3',
    description: 'Solving linear equations with one variable step by step.',
    keyConcepts: ['Balancing equations', 'Expansion', 'Subject of formula'],
    sampleQuestion: 'Solve for x: 3x - 5 = 16.'
  },
  {
    id: 'jss2-sci-1',
    classLevel: 'JSS 2',
    subject: 'Basic Science',
    topicName: 'Ecosystems, Energy Flow & Food Chains',
    nerdcUnit: 'NERDC JSS2 Science Theme 2',
    description: 'Producers, consumers, and decomposers in rainforests and savannah grasslands.',
    keyConcepts: ['Producers', 'Primary Consumers', 'Secondary Consumers', 'Food Web'],
    sampleQuestion: 'In a Nigerian grassland ecosystem, what role do green cassava plants play?'
  },

  // JSS 3
  {
    id: 'jss3-math-1',
    classLevel: 'JSS 3',
    subject: 'Mathematics',
    topicName: 'Pythagoras Theorem & Trigonometry Ratios',
    nerdcUnit: 'NERDC JSS3 Math Theme 4',
    description: 'Right-angled triangles, sine, cosine, tangent applications in construction.',
    keyConcepts: ['Hypotenuse', 'Opposite', 'Adjacent', 'a² + b² = c²'],
    sampleQuestion: 'A ladder 5 metres long rests against a wall 4 metres high. How far is the base from the wall?'
  },

  // SS 1
  {
    id: 'ss1-math-1',
    classLevel: 'SS 1',
    subject: 'Mathematics',
    topicName: 'Quadratic Equations & Factorization',
    nerdcUnit: 'NERDC SS1 Math Topic 3',
    description: 'Solving quadratic equations by factorization, completing the square, and quadratic formula.',
    keyConcepts: ['Factorization', 'Quadratic formula x = (-b ± √(b² - 4ac)) / 2a', 'Roots of equation'],
    sampleQuestion: 'Solve by factorization: x² - 5x + 6 = 0.'
  },
  {
    id: 'ss1-phy-1',
    classLevel: 'SS 1',
    subject: 'Physics',
    topicName: 'Motion, Velocity & Acceleration (WAEC Syllabus)',
    nerdcUnit: 'NERDC SS1 Physics Topic 1',
    description: 'Distance-time graphs and equations of motion for moving vehicles like trains and cars.',
    keyConcepts: ['Velocity (v)', 'Acceleration (a)', 'v = u + at', 's = ut + ½at²'],
    sampleQuestion: 'A car starts from rest and accelerates uniformly at 2 m/s² for 10 seconds. Find its final velocity.'
  },

  // SS 2
  {
    id: 'ss2-math-1',
    classLevel: 'SS 2',
    subject: 'Mathematics',
    topicName: 'Logarithms, Indices & Sequences (AP & GP)',
    nerdcUnit: 'NERDC SS2 Math Topic 2',
    description: 'Arithmetic Progressions (AP) and Geometric Progressions (GP) with practical applications.',
    keyConcepts: ['First term (a)', 'Common difference (d)', 'nth term T_n = a + (n-1)d', 'Sum S_n'],
    sampleQuestion: 'Find the 10th term of an AP whose first term is 3 and common difference is 4.'
  },
  {
    id: 'ss2-chem-1',
    classLevel: 'SS 2',
    subject: 'Chemistry',
    topicName: 'Periodic Table, Chemical Bonding & Stoichiometry',
    nerdcUnit: 'NERDC SS2 Chemistry Topic 4',
    description: 'Ionic, covalent, and metallic bonding, mole concept and molar calculations.',
    keyConcepts: ['Periodic trends', 'Electronegativity', 'Mole concept', 'Molar mass'],
    sampleQuestion: 'How many moles are present in 44 grams of Carbon Dioxide (CO₂)?'
  },

  // SS 3
  {
    id: 'ss3-math-1',
    classLevel: 'SS 3',
    subject: 'Mathematics',
    topicName: 'Calculus: Differentiation & Integration (WAEC / JAMB Prep)',
    nerdcUnit: 'NERDC SS3 Math Topic 1',
    description: 'Rates of change, derivatives of polynomial functions, and definite integrals.',
    keyConcepts: ['dy/dx', 'Power rule d/dx(x^n) = n*x^(n-1)', 'Definite integral', 'Area under curve'],
    sampleQuestion: 'Find the derivative dy/dx of y = 3x³ - 5x² + 4x - 7.'
  },
  {
    id: 'ss3-bio-1',
    classLevel: 'SS 3',
    subject: 'Biology',
    topicName: 'Genetics, Heredity & Mendel laws',
    nerdcUnit: 'NERDC SS3 Biology Topic 3',
    description: 'Inheritance of traits, blood groups, sickle cell allele genetics, and Punnett squares.',
    keyConcepts: ['Dominant & Recessive alleles', 'Genotype vs Phenotype', 'Sickle cell anaemia genetics'],
    sampleQuestion: 'If two carrier parents (AS) have a child, what is the probability of having an SS genotype?'
  }
];

export function getCurriculumForClass(classLevel: string): CurriculumTopic[] {
  return NERDC_CURRICULUM.filter(t => t.classLevel === classLevel);
}
