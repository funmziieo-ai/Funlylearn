import { LeaderboardUser } from '../types';

const girlAvatar = '/assets/images/3d_nigerian_girl_avatar_1784829212783.jpg';
const boyAvatar = '/assets/images/3d_nigerian_boy_avatar_1784829225940.jpg';
const childGlassesAvatar = '/assets/images/3d_nigerian_child_avatar_1784829240662.jpg';

export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    id: 'u1',
    name: 'Amara',
    stars: 1850,
    classLevel: 'JSS 2',
    avatarUrl: girlAvatar,
    levelBadge: 'LEVEL 18'
  },
  {
    rank: 2,
    id: 'u2',
    name: 'Tunde',
    stars: 1420,
    classLevel: 'Primary 5',
    avatarUrl: boyAvatar,
    levelBadge: 'LEVEL 15'
  },
  {
    rank: 3,
    id: 'u3',
    name: 'Chidi',
    stars: 1280,
    classLevel: 'SS 1',
    avatarUrl: childGlassesAvatar,
    levelBadge: 'LEVEL 14'
  },
  {
    rank: 4,
    id: 'u4',
    name: 'Zainab',
    stars: 985,
    classLevel: 'Primary 4',
    avatarUrl: girlAvatar,
    levelBadge: 'LEVEL 12'
  },
  {
    rank: 5,
    id: 'user-self',
    name: 'You (Tobi)',
    stars: 942,
    classLevel: 'JSS 1',
    isUser: true,
    avatarUrl: boyAvatar,
    levelBadge: 'LEVEL 12'
  },
  {
    rank: 6,
    id: 'u5',
    name: 'Bayo',
    stars: 890,
    classLevel: 'Primary 6',
    avatarUrl: childGlassesAvatar,
    levelBadge: 'LEVEL 11'
  },
  {
    rank: 7,
    id: 'u6',
    name: 'Nneka',
    stars: 810,
    classLevel: 'SS 2',
    avatarUrl: girlAvatar,
    levelBadge: 'LEVEL 10'
  }
];
