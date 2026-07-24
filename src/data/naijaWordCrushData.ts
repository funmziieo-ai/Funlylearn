export interface CrushWord {
  id: string;
  word: string;
  english: string;
  language: 'Yoruba' | 'Igbo' | 'Hausa';
  category: 'Greetings' | 'Family' | 'Food' | 'Animals' | 'School';
  itemEmoji: string; // Fruit/food/item icon
  itemName: string;  // Nigerian item label
  difficulty: 'easy' | 'medium' | 'hard';
  grandmaPhrase?: string; // Optional grandma script phrase
}

export interface NigerianItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const NIGERIAN_ITEMS: NigerianItem[] = [
  { id: 'mango', name: 'Mango', emoji: '🥭', color: 'bg-amber-400' },
  { id: 'pawpaw', name: 'Pawpaw', emoji: '🍈', color: 'bg-[#FF6B35]' },
  { id: 'coconut', name: 'Coconut', emoji: '🥥', color: 'bg-amber-800' },
  { id: 'plantain', name: 'Plantain', emoji: '🍌', color: 'bg-yellow-400' },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', color: 'bg-emerald-500' },
  { id: 'akara', name: 'Akara ball', emoji: '🟡', color: 'bg-[#E85523]' },
  { id: 'suya', name: 'Suya stick', emoji: '🍢', color: 'bg-red-600' },
  { id: 'chinchin', name: 'Chin chin', emoji: '⭐', color: 'bg-amber-300' }
];

export const WORD_CRUSH_VOCABULARY: CrushWord[] = [
  // --- YORUBA WORDS (Official NERDC Curriculum Orthography) ---
  // Greetings
  { id: 'yo-1', word: 'Ẹ kaarọ̀', english: 'Good morning', language: 'Yoruba', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ẹ kaarọ̀ ma! Mo fẹ́ràn rẹ!' },
  { id: 'yo-2', word: 'Ẹ kaasan', english: 'Good afternoon', language: 'Yoruba', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'medium' },
  { id: 'yo-3', word: 'Ẹ kaalẹ́', english: 'Good evening', language: 'Yoruba', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'medium' },
  { id: 'yo-4', word: 'Báwo ni', english: 'How are you', language: 'Yoruba', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'easy', grandmaPhrase: 'Báwo ni ma, mo n kàwé dáadáa!' },
  { id: 'yo-5', word: 'Ó dára', english: 'Fine / Good', language: 'Yoruba', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'easy' },

  // Family
  { id: 'yo-6', word: 'Bàbá', english: 'Father', language: 'Yoruba', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy' },
  { id: 'yo-7', word: 'Màmá', english: 'Mother', language: 'Yoruba', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy', grandmaPhrase: 'Màmá mi, ẹ ṣe púpọ̀!' },
  { id: 'yo-8', word: 'Ẹgbọ́n', english: 'Elder sibling', language: 'Yoruba', category: 'Family', itemEmoji: '🧒', itemName: 'Elder sibling', difficulty: 'easy' },
  { id: 'yo-9', word: 'Àbúrò', english: 'Younger sibling', language: 'Yoruba', category: 'Family', itemEmoji: '👶', itemName: 'Baby', difficulty: 'medium' },
  { id: 'yo-10', word: 'Ẹ̀bí', english: 'Family', language: 'Yoruba', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'easy' },

  // Food
  { id: 'yo-11', word: 'Ẹ̀bà', english: 'Eba', language: 'Yoruba', category: 'Food', itemEmoji: '🍲', itemName: 'Eba bowl', difficulty: 'easy' },
  { id: 'yo-12', word: 'Ẹ̀fọ́', english: 'Vegetable soup', language: 'Yoruba', category: 'Food', itemEmoji: '🥬', itemName: 'Efo Riro', difficulty: 'easy' },
  { id: 'yo-13', word: 'Omi', english: 'Water', language: 'Yoruba', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'easy' },
  { id: 'yo-14', word: 'Ẹran', english: 'Meat', language: 'Yoruba', category: 'Food', itemEmoji: '🥩', itemName: 'Suya meat', difficulty: 'easy' },
  { id: 'yo-15', word: 'Iṣu', english: 'Yam', language: 'Yoruba', category: 'Food', itemEmoji: '🟤', itemName: 'Yam tuber', difficulty: 'easy' },
  { id: 'yo-16', word: 'Àgbàdo', english: 'Corn', language: 'Yoruba', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'medium' },
  { id: 'yo-17', word: 'Ọ̀gẹ̀dẹ̀', english: 'Banana / Plantain', language: 'Yoruba', category: 'Food', itemEmoji: '🍌', itemName: 'Dodo Plantain', difficulty: 'medium' },

  // Animals
  { id: 'yo-18', word: 'Ajá', english: 'Dog', language: 'Yoruba', category: 'Animals', itemEmoji: '🐕', itemName: 'Dog', difficulty: 'easy' },
  { id: 'yo-19', word: 'Ọlọ́gbò', english: 'Cat', language: 'Yoruba', category: 'Animals', itemEmoji: '🐈', itemName: 'Cat', difficulty: 'medium' },
  { id: 'yo-20', word: 'Ẹyẹ', english: 'Bird', language: 'Yoruba', category: 'Animals', itemEmoji: '🐦', itemName: 'Bird', difficulty: 'easy' },
  { id: 'yo-21', word: 'Ẹja', english: 'Fish', language: 'Yoruba', category: 'Animals', itemEmoji: '🐟', itemName: 'Fish', difficulty: 'easy' },
  { id: 'yo-22', word: 'Ẹkurẹ́', english: 'Rat', language: 'Yoruba', category: 'Animals', itemEmoji: '🐀', itemName: 'Rat', difficulty: 'medium' },

  // --- IGBO WORDS ---
  // Greetings
  { id: 'ig-1', word: 'Ututu oma', english: 'Good morning', language: 'Igbo', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ututu oma nne nne! Kedu ka mere?' },
  { id: 'ig-2', word: 'Ehihie oma', english: 'Good afternoon', language: 'Igbo', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'hard' },
  { id: 'ig-3', word: 'Anyasi oma', english: 'Good evening', language: 'Igbo', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'hard' },
  { id: 'ig-4', word: 'Kedu', english: 'How are you', language: 'Igbo', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'easy', grandmaPhrase: 'Kedu nne! O di mma!' },
  { id: 'ig-5', word: 'O di mma', english: 'Fine / Good', language: 'Igbo', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'medium' },

  // Family
  { id: 'ig-6', word: 'Nna', english: 'Father', language: 'Igbo', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy' },
  { id: 'ig-7', word: 'Nne', english: 'Mother', language: 'Igbo', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy', grandmaPhrase: 'Nneoma m, a hụrụ m gị n’anya!' },
  { id: 'ig-8', word: 'Nwanne', english: 'Sibling', language: 'Igbo', category: 'Family', itemEmoji: '🧒', itemName: 'Sibling', difficulty: 'medium' },
  { id: 'ig-9', word: 'Ezinulo', english: 'Family', language: 'Igbo', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'medium' },

  // Food
  { id: 'ig-10', word: 'Ji', english: 'Yam', language: 'Igbo', category: 'Food', itemEmoji: '🟤', itemName: 'Yam tuber', difficulty: 'easy' },
  { id: 'ig-11', word: 'Akpu', english: 'Fufu', language: 'Igbo', category: 'Food', itemEmoji: '🤍', itemName: 'Fufu ball', difficulty: 'easy' },
  { id: 'ig-12', word: 'Mmiri', english: 'Water', language: 'Igbo', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'medium' },
  { id: 'ig-13', word: 'Okpa', english: 'Beans pudding', language: 'Igbo', category: 'Food', itemEmoji: '🫘', itemName: 'Okpa', difficulty: 'easy' },
  { id: 'ig-14', word: 'Oka', english: 'Corn', language: 'Igbo', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'easy' },

  // --- HAUSA WORDS ---
  // Greetings
  { id: 'ha-1', word: 'Ina kwana', english: 'Good morning', language: 'Hausa', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ina kwana kaka! Lafiya lau!' },
  { id: 'ha-2', word: 'Ina wuni', english: 'Good afternoon', language: 'Hausa', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'medium' },
  { id: 'ha-3', word: 'Barka da yamma', english: 'Good evening', language: 'Hausa', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'hard' },
  { id: 'ha-4', word: 'Yaya dai', english: 'How are you', language: 'Hausa', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'medium' },
  { id: 'ha-5', word: 'Lafiya', english: 'Fine / Good', language: 'Hausa', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'easy', grandmaPhrase: 'Lafiya lau kaka! Nagode!' },

  // Family
  { id: 'ha-6', word: 'Uba', english: 'Father', language: 'Hausa', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy' },
  { id: 'ha-7', word: 'Uwa', english: 'Mother', language: 'Hausa', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy' },
  { id: 'ha-8', word: 'Dan uwa', english: 'Sibling', language: 'Hausa', category: 'Family', itemEmoji: '🧒', itemName: 'Sibling', difficulty: 'medium' },
  { id: 'ha-9', word: 'Iyali', english: 'Family', language: 'Hausa', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'medium' },

  // Food
  { id: 'ha-10', word: 'Tuwo', english: 'Tuwo / Swallow', language: 'Hausa', category: 'Food', itemEmoji: '🍲', itemName: 'Tuwo Shinkafa', difficulty: 'easy' },
  { id: 'ha-11', word: 'Ruwa', english: 'Water', language: 'Hausa', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'easy' },
  { id: 'ha-12', word: 'Nama', english: 'Meat', language: 'Hausa', category: 'Food', itemEmoji: '🥩', itemName: 'Suya Nama', difficulty: 'easy' },
  { id: 'ha-13', word: 'Masara', english: 'Corn', language: 'Hausa', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'medium' }
];

export const GRANDMA_SCRIPTS = {
  Yoruba: [
    { yo: 'E kaaro ma!', en: 'Good morning Grandma!' },
    { yo: 'Mo feran e pupo!', en: 'I love you very much!' },
    { yo: 'Mo n kawe daadaa ni ile iwe!', en: 'I am studying hard in school!' }
  ],
  Igbo: [
    { yo: 'Ututu oma nne nne!', en: 'Good morning Grandma!' },
    { yo: 'A hụrụ m gị n’anya mikpo!', en: 'I love you so much!' },
    { yo: 'A na m a-mụ akwụkwọ nke ọma!', en: 'I am doing well in my studies!' }
  ],
  Hausa: [
    { yo: 'Ina kwana Kaka!', en: 'Good morning Grandma!' },
    { yo: 'Ina son ki sosai!', en: 'I love you very much!' },
    { yo: 'Ina karatu da kyau a makaranta!', en: 'I am doing very well in school!' }
  ]
};
