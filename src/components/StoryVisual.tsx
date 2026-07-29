import React from 'react';

interface StoryVisualProps {
  text: string;
}

const KEYWORDS: { words: string[]; emoji: string; label: string }[] = [
  { words: ['market', 'balogun', 'mile 12', 'ojuelegba', 'sell', 'bought', 'shop', 'trader', 'price'], emoji: '🏪', label: 'Nigerian Market' },
  { words: ['eba', 'egusi', 'jollof', 'akara', 'suya', 'puff puff', 'moi moi', 'food', 'eat', 'cook', 'rice', 'soup'], emoji: '🍲', label: 'Nigerian Food' },
  { words: ['naira', 'money', 'kobo', 'pay', 'change', 'cost', 'coins', 'profit', 'loss'], emoji: '💰', label: 'Naira Money' },
  { words: ['friend', 'friends', 'tunde', 'amaka', 'chidi', 'fatima', 'emeka', 'bisi', 'ngozi', 'children', 'child'], emoji: '👫', label: 'Nigerian Children' },
  { words: ['school', 'class', 'teacher', 'learn', 'book', 'write', 'read', 'homework', 'lesson', 'study'], emoji: '📚', label: 'School' },
  { words: ['farm', 'yam', 'corn', 'plantain', 'banana', 'mango', 'orange', 'fruit', 'harvest', 'garden'], emoji: '🌽', label: 'Nigerian Farm' },
  { words: ['bus', 'danfo', 'road', 'drive', 'travel', 'lagos', 'abuja', 'kano', 'journey', 'okada'], emoji: '🚌', label: 'Nigerian Transport' },
  { words: ['water', 'river', 'ocean', 'rain', 'drink', 'well', 'bucket', 'sea', 'flood'], emoji: '💧', label: 'Water' },
  { words: ['house', 'home', 'family', 'mama', 'papa', 'father', 'mother', 'brother', 'sister', 'parent'], emoji: '🏠', label: 'Nigerian Home' },
  { words: ['football', 'play', 'game', 'sport', 'run', 'jump', 'ball', 'match'], emoji: '⚽', label: 'Play Time' },
  { words: ['church', 'mosque', 'pray', 'sunday', 'friday', 'worship', 'god'], emoji: '🕌', label: 'Place of Worship' },
  { words: ['multiply', 'times', 'multiplication', 'divide', 'division', 'fraction', 'add', 'subtract', 'equation', 'calculate'], emoji: '🔢', label: 'Mathematics' },
  { words: ['plant', 'leaf', 'flower', 'tree', 'grow', 'seed', 'root', 'photosynthesis'], emoji: '🌿', label: 'Plants' },
  { words: ['animal', 'dog', 'cat', 'bird', 'fish', 'chicken', 'goat', 'cow', 'lion'], emoji: '🐄', label: 'Animals' },
  { words: ['ehhh', 'gold star', 'brilliant', 'superstar', 'proud', 'excellent', 'genius'], emoji: '⭐', label: 'Achievement' },
  { words: ['blood', 'heart', 'body', 'bone', 'muscle', 'organ', 'cell', 'tissue'], emoji: '🫀', label: 'Human Body' },
  { words: ['nigeria', 'nigerian', 'government', 'president', 'state', 'capital', 'independence'], emoji: '🇳🇬', label: 'Nigeria' },
];

export const StoryVisual: React.FC<StoryVisualProps> = ({ text }) => {
  const lower = text.toLowerCase();
  const match = KEYWORDS.find(k =>
    k.words.some(word => lower.includes(word))
  );
  if (!match) return null;

  return (
    <div className="mt-2 inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
      <span className="text-2xl">{match.emoji}</span>
      <span className="text-xs text-amber-800 font-semibold">{match.label}</span>
    </div>
  );
};
