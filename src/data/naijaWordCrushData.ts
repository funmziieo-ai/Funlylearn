export interface CrushWord {
  id: string;
  word: string;
  english: string;
  language: 'Yoruba' | 'Igbo' | 'Hausa';
  category: 'Greetings' | 'Family' | 'Food' | 'Animals' | 'School' | 'Home' | 'Nature' | 'Numbers' | 'Wisdom';
  itemEmoji: string; // Fruit/food/item icon
  itemName: string;  // Nigerian item label
  difficulty: 'easy' | 'medium' | 'hard';
  grandmaPhrase?: string; // Optional grandma script phrase
  // Which age band this word is appropriate for. All existing content is
  // simple vocabulary (single words, basic greetings/family/food terms),
  // so it's tagged 'primary' across the board — JSS and SS bands need
  // genuinely new, harder content (compound phrases, proverbs, idioms)
  // written separately, not just this same vocabulary relabeled.
  ageBand: 'primary' | 'jss' | 'ss';
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
  { id: 'yo-1', word: 'Ẹ kaarọ̀', english: 'Good morning', language: 'Yoruba', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ẹ kaarọ̀ ma! Mo fẹ́ràn rẹ!', ageBand: 'primary' },
  { id: 'yo-2', word: 'Ẹ kaasan', english: 'Good afternoon', language: 'Yoruba', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-3', word: 'Ẹ kaalẹ́', english: 'Good evening', language: 'Yoruba', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-4', word: 'Báwo ni', english: 'How are you', language: 'Yoruba', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'easy', grandmaPhrase: 'Báwo ni ma, mo n kàwé dáadáa!', ageBand: 'primary' },
  { id: 'yo-5', word: 'Ó dára', english: 'Fine / Good', language: 'Yoruba', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'easy', ageBand: 'primary' },

  // Family
  { id: 'yo-6', word: 'Bàbá', english: 'Father', language: 'Yoruba', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-7', word: 'Màmá', english: 'Mother', language: 'Yoruba', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy', grandmaPhrase: 'Màmá mi, ẹ ṣe púpọ̀!', ageBand: 'primary' },
  { id: 'yo-8', word: 'Ẹgbọ́n', english: 'Elder sibling', language: 'Yoruba', category: 'Family', itemEmoji: '🧒', itemName: 'Elder sibling', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-9', word: 'Àbúrò', english: 'Younger sibling', language: 'Yoruba', category: 'Family', itemEmoji: '👶', itemName: 'Baby', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-10', word: 'Ẹ̀bí', english: 'Family', language: 'Yoruba', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'easy', ageBand: 'primary' },

  // Food
  { id: 'yo-11', word: 'Ẹ̀bà', english: 'Eba', language: 'Yoruba', category: 'Food', itemEmoji: '🍲', itemName: 'Eba bowl', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-12', word: 'Ẹ̀fọ́', english: 'Vegetable soup', language: 'Yoruba', category: 'Food', itemEmoji: '🥬', itemName: 'Efo Riro', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-13', word: 'Omi', english: 'Water', language: 'Yoruba', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-14', word: 'Ẹran', english: 'Meat', language: 'Yoruba', category: 'Food', itemEmoji: '🥩', itemName: 'Suya meat', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-15', word: 'Iṣu', english: 'Yam', language: 'Yoruba', category: 'Food', itemEmoji: '🟤', itemName: 'Yam tuber', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-16', word: 'Àgbàdo', english: 'Corn', language: 'Yoruba', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-17', word: 'Ọ̀gẹ̀dẹ̀', english: 'Banana / Plantain', language: 'Yoruba', category: 'Food', itemEmoji: '🍌', itemName: 'Dodo Plantain', difficulty: 'medium', ageBand: 'primary' },

  // Animals
  { id: 'yo-18', word: 'Ajá', english: 'Dog', language: 'Yoruba', category: 'Animals', itemEmoji: '🐕', itemName: 'Dog', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-19', word: 'Ọlọ́gbò', english: 'Cat', language: 'Yoruba', category: 'Animals', itemEmoji: '🐈', itemName: 'Cat', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-20', word: 'Ẹyẹ', english: 'Bird', language: 'Yoruba', category: 'Animals', itemEmoji: '🐦', itemName: 'Bird', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-21', word: 'Ẹja', english: 'Fish', language: 'Yoruba', category: 'Animals', itemEmoji: '🐟', itemName: 'Fish', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-22', word: 'Eku', english: 'Rat', language: 'Yoruba', category: 'Animals', itemEmoji: '🐀', itemName: 'Rat', difficulty: 'easy', ageBand: 'primary' },
  // More everyday words (added for Word Crush; check spelling and tone marks with a Yorùbá speaker)
  { id: 'yo-23', word: 'Ọmọ', english: 'Child', language: 'Yoruba', category: 'Family', itemEmoji: '🧒', itemName: 'Child', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-24', word: 'Ọ̀rẹ́', english: 'Friend', language: 'Yoruba', category: 'Family', itemEmoji: '🤝', itemName: 'Friend', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-25', word: 'Ìwé', english: 'Book', language: 'Yoruba', category: 'School', itemEmoji: '📖', itemName: 'Book', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-26', word: 'Olùkọ́', english: 'Teacher', language: 'Yoruba', category: 'School', itemEmoji: '🧑🏾‍🏫', itemName: 'Teacher', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-27', word: 'Ìdánwò', english: 'Exam', language: 'Yoruba', category: 'School', itemEmoji: '📝', itemName: 'Exam', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-28', word: 'Ìṣirò', english: 'Mathematics', language: 'Yoruba', category: 'School', itemEmoji: '🔢', itemName: 'Mathematics', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-29', word: 'Ilé', english: 'House', language: 'Yoruba', category: 'Home', itemEmoji: '🏠', itemName: 'House', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-30', word: 'Ilẹ̀kùn', english: 'Door', language: 'Yoruba', category: 'Home', itemEmoji: '🚪', itemName: 'Door', difficulty: 'hard', ageBand: 'primary' },
  { id: 'yo-31', word: 'Fèrèsé', english: 'Window', language: 'Yoruba', category: 'Home', itemEmoji: '🪟', itemName: 'Window', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-32', word: 'Bàtà', english: 'Shoe', language: 'Yoruba', category: 'Home', itemEmoji: '👟', itemName: 'Shoe', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-33', word: 'Aṣọ', english: 'Cloth', language: 'Yoruba', category: 'Home', itemEmoji: '👕', itemName: 'Cloth', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-34', word: 'Ọjà', english: 'Market', language: 'Yoruba', category: 'Food', itemEmoji: '🛒', itemName: 'Market', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-35', word: 'Owó', english: 'Money', language: 'Yoruba', category: 'Food', itemEmoji: '💰', itemName: 'Money', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-36', word: 'Oúnjẹ', english: 'Food', language: 'Yoruba', category: 'Food', itemEmoji: '🍛', itemName: 'Food', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-37', word: 'Àkàrà', english: 'Bean cake', language: 'Yoruba', category: 'Food', itemEmoji: '🟤', itemName: 'Bean cake', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-38', word: 'Ẹ̀gúsí', english: 'Melon seed soup', language: 'Yoruba', category: 'Food', itemEmoji: '🍲', itemName: 'Melon seed soup', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-39', word: 'Iyán', english: 'Pounded yam', language: 'Yoruba', category: 'Food', itemEmoji: '🥣', itemName: 'Pounded yam', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-40', word: 'Ìrẹsì', english: 'Rice', language: 'Yoruba', category: 'Food', itemEmoji: '🍚', itemName: 'Rice', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-41', word: 'Ọsàn', english: 'Orange', language: 'Yoruba', category: 'Food', itemEmoji: '🍊', itemName: 'Orange', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-42', word: 'Adìẹ', english: 'Chicken', language: 'Yoruba', category: 'Animals', itemEmoji: '🐔', itemName: 'Chicken', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-43', word: 'Ewúrẹ́', english: 'Goat', language: 'Yoruba', category: 'Animals', itemEmoji: '🐐', itemName: 'Goat', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-44', word: 'Àgùntàn', english: 'Sheep', language: 'Yoruba', category: 'Animals', itemEmoji: '🐑', itemName: 'Sheep', difficulty: 'hard', ageBand: 'primary' },
  { id: 'yo-45', word: 'Ẹṣin', english: 'Horse', language: 'Yoruba', category: 'Animals', itemEmoji: '🐎', itemName: 'Horse', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-46', word: 'Erin', english: 'Elephant', language: 'Yoruba', category: 'Animals', itemEmoji: '🐘', itemName: 'Elephant', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-47', word: 'Kìnnìún', english: 'Lion', language: 'Yoruba', category: 'Animals', itemEmoji: '🦁', itemName: 'Lion', difficulty: 'hard', ageBand: 'primary' },
  { id: 'yo-48', word: 'Ọ̀bọ', english: 'Monkey', language: 'Yoruba', category: 'Animals', itemEmoji: '🐒', itemName: 'Monkey', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-49', word: 'Oòrùn', english: 'Sun', language: 'Yoruba', category: 'Nature', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-50', word: 'Òjò', english: 'Rain', language: 'Yoruba', category: 'Nature', itemEmoji: '🌧️', itemName: 'Rain', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-51', word: 'Igi', english: 'Tree', language: 'Yoruba', category: 'Nature', itemEmoji: '🌳', itemName: 'Tree', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-52', word: 'Ewé', english: 'Leaf', language: 'Yoruba', category: 'Nature', itemEmoji: '🍃', itemName: 'Leaf', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-53', word: 'Ẹ ṣé', english: 'Thank you', language: 'Yoruba', category: 'Greetings', itemEmoji: '🙏🏾', itemName: 'Thank you', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-54', word: 'Ẹ káàbọ̀', english: 'Welcome', language: 'Yoruba', category: 'Greetings', itemEmoji: '🤗', itemName: 'Welcome', difficulty: 'hard', ageBand: 'primary' },
  { id: 'yo-55', word: 'Sùúrù', english: 'Patience', language: 'Yoruba', category: 'Wisdom', itemEmoji: '⏳', itemName: 'Patience', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-56', word: 'Àlàáfíà', english: 'Peace and good health', language: 'Yoruba', category: 'Wisdom', itemEmoji: '🕊️', itemName: 'Peace and good health', difficulty: 'hard', ageBand: 'primary' },
  { id: 'yo-57', word: 'Ọ̀kan', english: 'One', language: 'Yoruba', category: 'Numbers', itemEmoji: '1️⃣', itemName: 'One', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-58', word: 'Èjì', english: 'Two', language: 'Yoruba', category: 'Numbers', itemEmoji: '2️⃣', itemName: 'Two', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-59', word: 'Ẹ̀ta', english: 'Three', language: 'Yoruba', category: 'Numbers', itemEmoji: '3️⃣', itemName: 'Three', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-60', word: 'Ẹ̀rin', english: 'Four', language: 'Yoruba', category: 'Numbers', itemEmoji: '4️⃣', itemName: 'Four', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-61', word: 'Àrún', english: 'Five', language: 'Yoruba', category: 'Numbers', itemEmoji: '5️⃣', itemName: 'Five', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-62', word: 'Ẹ̀fà', english: 'Six', language: 'Yoruba', category: 'Numbers', itemEmoji: '6️⃣', itemName: 'Six', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-63', word: 'Èje', english: 'Seven', language: 'Yoruba', category: 'Numbers', itemEmoji: '7️⃣', itemName: 'Seven', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-64', word: 'Ẹ̀jọ', english: 'Eight', language: 'Yoruba', category: 'Numbers', itemEmoji: '8️⃣', itemName: 'Eight', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-65', word: 'Ẹ̀sán', english: 'Nine', language: 'Yoruba', category: 'Numbers', itemEmoji: '9️⃣', itemName: 'Nine', difficulty: 'medium', ageBand: 'primary' },
  { id: 'yo-66', word: 'Ẹ̀wá', english: 'Ten', language: 'Yoruba', category: 'Numbers', itemEmoji: '🔟', itemName: 'Ten', difficulty: 'easy', ageBand: 'primary' },
  { id: 'yo-67', word: 'Ẹyin', english: 'Egg', language: 'Yoruba', category: 'Food', itemEmoji: '🥚', itemName: 'Egg', difficulty: 'easy', ageBand: 'primary' },

  // --- IGBO WORDS ---
  // Greetings
  { id: 'ig-1', word: 'Ututu oma', english: 'Good morning', language: 'Igbo', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ututu oma nne nne! Kedu ka mere?', ageBand: 'primary' },
  { id: 'ig-2', word: 'Ehihie oma', english: 'Good afternoon', language: 'Igbo', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'hard', ageBand: 'primary' },
  { id: 'ig-3', word: 'Anyasi oma', english: 'Good evening', language: 'Igbo', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'hard', ageBand: 'primary' },
  { id: 'ig-4', word: 'Kedu', english: 'How are you', language: 'Igbo', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'easy', grandmaPhrase: 'Kedu nne! O di mma!', ageBand: 'primary' },
  { id: 'ig-5', word: 'O di mma', english: 'Fine / Good', language: 'Igbo', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'medium', ageBand: 'primary' },

  // Family
  { id: 'ig-6', word: 'Nna', english: 'Father', language: 'Igbo', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ig-7', word: 'Nne', english: 'Mother', language: 'Igbo', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy', grandmaPhrase: 'Nneoma m, a hụrụ m gị n’anya!', ageBand: 'primary' },
  { id: 'ig-8', word: 'Nwanne', english: 'Sibling', language: 'Igbo', category: 'Family', itemEmoji: '🧒', itemName: 'Sibling', difficulty: 'medium', ageBand: 'primary' },
  { id: 'ig-9', word: 'Ezinulo', english: 'Family', language: 'Igbo', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'medium', ageBand: 'primary' },

  // Food
  { id: 'ig-10', word: 'Ji', english: 'Yam', language: 'Igbo', category: 'Food', itemEmoji: '🟤', itemName: 'Yam tuber', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ig-11', word: 'Akpu', english: 'Fufu', language: 'Igbo', category: 'Food', itemEmoji: '🤍', itemName: 'Fufu ball', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ig-12', word: 'Mmiri', english: 'Water', language: 'Igbo', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'medium', ageBand: 'primary' },
  { id: 'ig-13', word: 'Okpa', english: 'Beans pudding', language: 'Igbo', category: 'Food', itemEmoji: '🫘', itemName: 'Okpa', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ig-14', word: 'Oka', english: 'Corn', language: 'Igbo', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'easy', ageBand: 'primary' },

  // --- HAUSA WORDS ---
  // Greetings
  { id: 'ha-1', word: 'Ina kwana', english: 'Good morning', language: 'Hausa', category: 'Greetings', itemEmoji: '🌅', itemName: 'Morning Sun', difficulty: 'medium', grandmaPhrase: 'Ina kwana kaka! Lafiya lau!', ageBand: 'primary' },
  { id: 'ha-2', word: 'Ina wuni', english: 'Good afternoon', language: 'Hausa', category: 'Greetings', itemEmoji: '☀️', itemName: 'Sun', difficulty: 'medium', ageBand: 'primary' },
  { id: 'ha-3', word: 'Barka da yamma', english: 'Good evening', language: 'Hausa', category: 'Greetings', itemEmoji: '🌙', itemName: 'Moon', difficulty: 'hard', ageBand: 'primary' },
  { id: 'ha-4', word: 'Yaya dai', english: 'How are you', language: 'Hausa', category: 'Greetings', itemEmoji: '😊', itemName: 'Smile', difficulty: 'medium', ageBand: 'primary' },
  { id: 'ha-5', word: 'Lafiya', english: 'Fine / Good', language: 'Hausa', category: 'Greetings', itemEmoji: '✅', itemName: 'Check', difficulty: 'easy', grandmaPhrase: 'Lafiya lau kaka! Nagode!', ageBand: 'primary' },

  // Family
  { id: 'ha-6', word: 'Uba', english: 'Father', language: 'Hausa', category: 'Family', itemEmoji: '👨', itemName: 'Father', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ha-7', word: 'Uwa', english: 'Mother', language: 'Hausa', category: 'Family', itemEmoji: '👩', itemName: 'Mother', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ha-8', word: 'Dan uwa', english: 'Sibling', language: 'Hausa', category: 'Family', itemEmoji: '🧒', itemName: 'Sibling', difficulty: 'medium', ageBand: 'primary' },
  { id: 'ha-9', word: 'Iyali', english: 'Family', language: 'Hausa', category: 'Family', itemEmoji: '👨‍👩‍👧', itemName: 'Family', difficulty: 'medium', ageBand: 'primary' },

  // Food
  { id: 'ha-10', word: 'Tuwo', english: 'Tuwo / Swallow', language: 'Hausa', category: 'Food', itemEmoji: '🍲', itemName: 'Tuwo Shinkafa', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ha-11', word: 'Ruwa', english: 'Water', language: 'Hausa', category: 'Food', itemEmoji: '💧', itemName: 'Water drop', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ha-12', word: 'Nama', english: 'Meat', language: 'Hausa', category: 'Food', itemEmoji: '🥩', itemName: 'Suya Nama', difficulty: 'easy', ageBand: 'primary' },
  { id: 'ha-13', word: 'Masara', english: 'Corn', language: 'Hausa', category: 'Food', itemEmoji: '🌽', itemName: 'Corn cob', difficulty: 'medium', ageBand: 'primary' }
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
