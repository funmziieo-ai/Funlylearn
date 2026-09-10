import React, { useState } from 'react';
import { Search as SearchIcon, GraduationCap, MessageCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { UserProfile } from '../types';
import { searchAppContent, SearchResults } from '../services/supabaseService';

interface SearchPageProps {
  profile: UserProfile;
  userId: string;
  onNavigateToExamPrep: () => void;
}

// Searches across both real halves of the app's content: Exam Prep
// topics (subject/topic names) and the child's own past homework
// history. A single search box that genuinely covers "everything",
// rather than being scoped to just one feature.
export const SearchPage: React.FC<SearchPageProps> = ({ profile, userId, onNavigateToExamPrep }) => {
  const isYoruba = profile.language === 'yo';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (text: string) => {
    if (!text.trim()) {
      setResults(null);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    const data = await searchAppContent(userId, text);
    setResults(data);
    setIsSearching(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runSearch(query);
    }
  };

  const totalResults = (results?.topics.length || 0) + (results?.homework.length || 0);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-28 font-sans">

      <div className="bg-[#064E3B] text-white p-5 rounded-3xl border-2 border-amber-400/40 shadow-xl">
        <h1 className="font-serif text-xl font-bold mb-3">
          {isYoruba ? 'Wá Ohunkohun' : 'Search FunlyLearn'}
        </h1>
        <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-inner">
          <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isYoruba
                ? 'Wa koko-ọrọ tabi iṣẹ ile atijọ...'
                : 'Search topics or your past homework...'
            }
            className="flex-1 bg-transparent outline-none border-none text-sm text-slate-800 placeholder:text-slate-400 px-3"
          />
          <button
            onClick={() => runSearch(query)}
            className="px-3.5 py-1.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85523] text-white text-xs font-jakarta font-bold transition-all shrink-0"
          >
            {isYoruba ? 'Wá' : 'Search'}
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="py-10 text-center text-sm text-slate-500">
          {isYoruba ? 'N wá...' : 'Searching...'}
        </div>
      )}

      {!isSearching && hasSearched && totalResults === 0 && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <span className="text-3xl block">🔍</span>
          <p className="text-sm font-medium text-slate-600">
            {isYoruba ? 'Ko si nkankan ti a ri' : 'No results found'}
          </p>
          <p className="text-xs text-slate-400">
            {isYoruba
              ? 'Gbiyanju ọrọ miran tabi ṣayẹwo akọtọ rẹ'
              : 'Try a different word or check your spelling'}
          </p>
        </div>
      )}

      {!isSearching && results && results.topics.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-jakarta font-bold uppercase tracking-wider text-slate-500 px-1">
            {isYoruba ? 'Àwọn Kókó Àyẹ̀wò' : 'Exam Prep Topics'}
          </h2>
          {results.topics.map((topic) => (
            <button
              key={`${topic.examId}-${topic.topicId}`}
              onClick={onNavigateToExamPrep}
              className="w-full bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-soft text-left transition-all flex items-center space-x-3 group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-jakarta font-bold text-sm text-slate-900 truncate">
                  {topic.topicName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {topic.subjectIcon} {topic.subjectName} · {topic.examId.toUpperCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isSearching && results && results.homework.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-jakarta font-bold uppercase tracking-wider text-slate-500 px-1">
            {isYoruba ? 'Iṣẹ́ Ilé Rẹ Tẹ́lẹ̀' : 'Your Past Homework'}
          </h2>
          {results.homework.map((record) => (
            <div
              key={record.id}
              className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex items-start space-x-3"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-jakarta font-bold text-sm text-slate-900">
                  {record.topic}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock3 className="w-3 h-3" />
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  </span>
                  {record.wasCorrect && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isYoruba ? 'Tọ̀nà' : 'Correct'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasSearched && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <span className="text-3xl block">📚</span>
          <p className="text-sm font-medium text-slate-600">
            {isYoruba
              ? 'Bẹrẹ titẹ lati wa awọn koko-ọrọ tabi iṣẹ ile atijọ'
              : 'Start typing to search topics or your past homework'}
          </p>
        </div>
      )}

    </div>
  );
};
