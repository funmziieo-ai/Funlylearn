import { LingoWord } from '../types';

export const NAIJA_LINGO_WORDS: LingoWord[] = [
  {
    id: 'l1',
    word: 'Ẹ kaarọ',
    language: 'Yoruba',
    phonetic: 'Eh kah-raw',
    englishTranslation: 'Good morning',
    category: 'Greetings',
    culturalNote: 'Respectful morning greeting used across Western Nigeria, accompanied by a polite bend or knee bow.',
    sampleSentence: 'Ẹ kaarọ ma, ṣe dada le ji?',
    sentenceTranslation: 'Good morning ma, hope you slept well?'
  },
  {
    id: 'l2',
    word: 'Bawo ni',
    language: 'Yoruba',
    phonetic: 'Bah-woh nee',
    englishTranslation: 'How are you / Hello',
    category: 'Greetings',
    culturalNote: 'Friendly informal greeting among friends and schoolmates.',
    sampleSentence: 'Bawo ni Ore mi, nkalẹ?',
    sentenceTranslation: 'How are you my friend, what\'s happening?'
  },
  {
    id: 'l3',
    word: 'Ọmọluabi',
    language: 'Yoruba',
    phonetic: 'Oh-moh-loo-ah-bee',
    englishTranslation: 'A person of good character and wisdom',
    category: 'Wisdom',
    culturalNote: 'Highly cherished Nigerian Yoruba concept signifying integrity, respect, diligence, and nobility of character.',
    sampleSentence: 'Titi is a true Ọmọluabi who respects her elders.',
    sentenceTranslation: 'Titi is a person of good character who respects her elders.'
  },
  {
    id: 'l4',
    word: 'Ẹ ṣe pupọ',
    language: 'Yoruba',
    phonetic: 'Eh shay poo-poh',
    englishTranslation: 'Thank you very much',
    category: 'Greetings',
    culturalNote: 'Expresses deep gratitude and appreciation to teachers or parents.',
    sampleSentence: 'Ẹ ṣe pupọ Mama Titi for explaining my homework!',
    sentenceTranslation: 'Thank you very much Mama Titi for explaining my homework!'
  },
  {
    id: 'l5',
    word: 'Sannu de zuwa',
    language: 'Hausa',
    phonetic: 'San-noo deh zoo-wah',
    englishTranslation: 'Welcome',
    category: 'Greetings',
    culturalNote: 'Traditional warm welcome in Northern Nigerian culture.',
    sampleSentence: 'Sannu de zuwa, bismillah!',
    sentenceTranslation: 'Welcome, please come in!'
  },
  {
    id: 'l6',
    word: 'Ndeewo',
    language: 'Igbo',
    phonetic: 'Ndeh-woh',
    englishTranslation: 'Greetings / Hello',
    category: 'Greetings',
    culturalNote: 'Warm, respectful greeting across Eastern Nigeria.',
    sampleSentence: 'Ndeewo nne, kedu maka homework?',
    sentenceTranslation: 'Greetings mother, how is the homework?'
  },
  {
    id: 'l7',
    word: 'Ìwé',
    language: 'Yoruba',
    phonetic: 'Ee-weh',
    englishTranslation: 'Book / Notebook',
    category: 'School',
    culturalNote: 'Essential item for every dedicated student in school.',
    sampleSentence: 'Si ìwé rẹ si oju ewe mewa.',
    sentenceTranslation: 'Open your book to page ten.'
  },
  {
    id: 'l8',
    word: 'Olùkọ́',
    language: 'Yoruba',
    phonetic: 'Oh-loo-kaw',
    englishTranslation: 'Teacher',
    category: 'School',
    culturalNote: 'A guide who imparts knowledge, like Mama Titi.',
    sampleSentence: 'Olùkọ́ wa n kọ́ wa ni iṣiro today.',
    sentenceTranslation: 'Our teacher is teaching us mathematics today.'
  }
];

export const LINGO_QUIZZES = [
  {
    id: 'q1',
    word: 'Ẹ kaarọ',
    options: ['Good morning', 'Good night', 'Thank you', 'Goodbye'],
    correctAnswer: 'Good morning',
    explanation: 'Ẹ kaarọ is the Yoruba morning greeting.'
  },
  {
    id: 'q2',
    word: 'Ọmọluabi',
    options: ['A person of good character', 'A market buyer', 'A high speed bus', 'A sweet fruit'],
    correctAnswer: 'A person of good character',
    explanation: 'Ọmọluabi embodies dignity, honesty, and noble character.'
  },
  {
    id: 'q3',
    word: 'Ẹ ṣe pupọ',
    options: ['Thank you very much', 'See you tomorrow', 'Welcome home', 'I am hungry'],
    correctAnswer: 'Thank you very much',
    explanation: 'Ẹ ṣe pupọ expresses deep gratitude.'
  },
  {
    id: 'q4',
    word: 'Ìwé',
    options: ['Book', 'Pencil', 'Desk', 'Uniform'],
    correctAnswer: 'Book',
    explanation: 'Ìwé means book in Yoruba.'
  }
];
