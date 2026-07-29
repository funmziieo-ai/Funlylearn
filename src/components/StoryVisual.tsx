import React from 'react';

interface StoryVisualProps {
  text: string;
}

const KEYWORDS: {
  words: string[];
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    words: ['market', 'balogun', 'mile 12', 'ojuelegba', 'sell', 'bought', 'shop', 'trader', 'price'],
    emoji: '🏪',
    label: 'Nigerian Market',
    description: 'Busy Lagos market'
  },
  {
    words: ['eba', 'egusi', 'jollof', 'akara', 'suya', 'puff puff', 'moi moi', 'food', 'eat', 'cook', 'rice', 'soup'],
    emoji: '🍲',
    label: 'Nigerian Food',
    description: 'Delicious Nigerian food'
  },
  {
    words: ['naira', 'money', 'kobo', 'pay', 'change', 'cost', 'coins', 'profit', 'loss'],
    emoji: '💰',
    label: 'Naira Money',
    description: 'Nigerian Naira'
  },
  {
    words: ['friend', 'friends', 'tunde', 'amaka', 'chidi', 'fatima', 'emeka', 'bisi', 'ngozi', 'children', 'child'],
    emoji: '👫',
    label: 'Nigerian Children',
    description: 'Nigerian school children'
  },
  {
    words: ['school', 'class', 'teacher', 'learn', 'book', 'write', 'read', 'homework', 'lesson', 'study'],
    emoji: '📚',
    label: 'School',
    description: 'Nigerian school'
  },
  {
    words: ['farm', 'yam', 'corn', 'plantain', 'banana', 'mango', 'orange', 'fruit', 'harvest'],
    emoji: '🌽',
    label: 'Nigerian Farm',
    description: 'Nigerian farmland'
  },
  {
    words: ['bus', 'danfo', 'road', 'drive', 'travel', 'lagos', 'abuja', 'kano', 'journey', 'okada'],
    emoji: '🚌',
    label: 'Nigerian Transport',
    description: 'Lagos danfo bus'
  },
  {
    words: ['water', 'river', 'ocean', 'rain', 'drink', 'well', 'bucket', 'sea'],
    emoji: '💧',
    label: 'Water',
    description: 'Water source'
  },
  {
    words: ['house', 'home', 'family', 'mama', 'papa', 'father', 'mother', 'brother', 'sister', 'parent'],
    emoji: '🏠',
    label: 'Nigerian Home',
    description: 'Nigerian family home'
  },
  {
    words: ['football', 'play', 'game', 'sport', 'run', 'jump', 'ball', 'match'],
    emoji: '⚽',
    label: 'Play Time',
    description: 'Children playing'
  },
  {
    words: ['multiply', 'times', 'multiplication', 'divide', 'division', 'fraction', 'add', 'subtract', 'equation'],
    emoji: '🔢',
    label: 'Mathematics',
    description: 'Maths calculation'
  },
  {
    words: ['plant', 'leaf', 'flower', 'tree', 'grow', 'seed', 'root', 'photosynthesis'],
    emoji: '🌿',
    label: 'Plants',
    description: 'Nigerian plants'
  },
  {
    words: ['animal', 'dog', 'cat', 'bird', 'fish', 'chicken', 'goat', 'cow', 'lion'],
    emoji: '🐄',
    label: 'Animals',
    description: 'Nigerian animals'
  },
  {
    words: ['nigeria', 'nigerian', 'government', 'president', 'state', 'capital', 'independence'],
    emoji: '🇳🇬',
    label: 'Nigeria',
    description: 'Nigeria our country'
  },
  {
    words: ['blood', 'heart', 'body', 'bone', 'muscle', 'organ', 'cell', 'tissue'],
    emoji: '🫀',
    label: 'Human Body',
    description: 'Human body systems'
  },
  {
    words: ['church', 'mosque', 'pray', 'sunday', 'friday', 'worship', 'god'],
    emoji: '🕌',
    label: 'Place of Worship',
    description: 'Nigerian places of worship'
  },
];

function findAllMatches(text: string) {
  const lower = text.toLowerCase();
  const found: typeof KEYWORDS = [];
  const seenEmojis = new Set<string>();

  for (const keyword of KEYWORDS) {
    for (const word of keyword.words) {
      if (lower.includes(word) && !seenEmojis.has(keyword.emoji)) {
        found.push(keyword);
        seenEmojis.add(keyword.emoji);
        break;
      }
    }
  }
  return found.slice(0, 3);
}

export const StoryVisual: React.FC<StoryVisualProps> = ({ text }) => {
  const matches = findAllMatches(text);

  if (matches.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {matches.map((match, idx) => (
        <div
          key={idx}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-3 py-2 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-2xl shadow-sm shrink-0">
            {match.emoji}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">{match.label}</p>
            <p className="text-[10px] text-amber-700">{match.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
