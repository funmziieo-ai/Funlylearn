import { LingoLevel } from '../types';

export const COINS_PER_CORRECT = 10;
export const COINS_STREAK_BONUS = 20;
export const COINS_HOMEWORK_SNAP = 5;

export const LINGO_LEVELS: LingoLevel[] = [
  {
    id: 1,
    name: 'Beginner',
    description: 'Basic Yoruba greetings',
    coinsRequired: 0,
    emoji: '🌱',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100'
  },
  {
    id: 2,
    name: 'Greetings',
    description: 'Morning afternoon evening',
    coinsRequired: 50,
    emoji: '👋',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100'
  },
  {
    id: 3,
    name: 'Food & Market',
    description: 'Yoruba food and market words',
    coinsRequired: 100,
    emoji: '🍲',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100'
  },
  {
    id: 4,
    name: 'Family',
    description: 'Family members in Yoruba',
    coinsRequired: 150,
    emoji: '👨‍👩‍👧',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100'
  },
  {
    id: 5,
    name: 'School',
    description: 'School words in Yoruba',
    coinsRequired: 200,
    emoji: '📚',
    color: 'text-pink-800',
    bgColor: 'bg-pink-100'
  },
  {
    id: 6,
    name: 'Animals',
    description: 'Nigerian animals in Yoruba',
    coinsRequired: 300,
    emoji: '🦁',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100'
  },
  {
    id: 7,
    name: 'Numbers',
    description: 'Counting in Yoruba',
    coinsRequired: 400,
    emoji: '🔢',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100'
  },
  {
    id: 8,
    name: 'Master',
    description: 'Advanced Yoruba conversation',
    coinsRequired: 600,
    emoji: '👑',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100'
  },
];

export function getUnlockedLevels(coins: number): LingoLevel[] {
  return LINGO_LEVELS.filter(l => coins >= l.coinsRequired);
}

export function getNextLockedLevel(coins: number): LingoLevel | null {
  return LINGO_LEVELS.find(l => coins < l.coinsRequired) || null;
}

export function getCoinsToNextLevel(coins: number): number {
  const next = getNextLockedLevel(coins);
  if (!next) return 0;
  return next.coinsRequired - coins;
}
