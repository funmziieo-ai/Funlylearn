import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { MamaTitiAvatar } from './MamaTitiAvatar';

export const FeedbackForm: React.FC = () => {
  const [childAgeClass, setChildAgeClass] = useState('');
  const [workedSmoothly, setWorkedSmoothly] = useState('');
  const [helpedUnderstanding, setHelpedUnderstanding] = useState('');
  const [wouldPay, setWouldPay] = useState('');
  const [otherComments, setOtherComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!childAgeClass.trim()) {
      setError('Please tell us your child\'s age/class — everything else is optional.');
      return;
    }

    if (!supabase) {
      setError('Unable to connect right now. Please try again in a moment.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('app_feedback').insert({
        child_age_class: childAgeClass.trim(),
        worked_smoothly: workedSmoothly.trim() || null,
        helped_understanding: helpedUnderstanding || null,
        would_pay: wouldPay || null,
        other_comments: otherComments.trim() || null
      });
      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err: any) {
      setError('Something went wrong sending your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#064E3B] flex flex-col items-center justify-center px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-white text-xl font-bold mb-2">Thank You!</h1>
        <p className="text-emerald-200 text-sm max-w-sm">
          Your feedback genuinely helps us improve FunlyLearn for Nigerian children. We appreciate you taking the time.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#064E3B] px-5 py-8 flex flex-col items-center">
      <MamaTitiAvatar size="lg" showOnlineStatus={false} className="mb-3" />
      <h1 className="text-white text-xl font-bold text-center mb-1">Quick Feedback</h1>
      <p className="text-emerald-200 text-xs text-center mb-6 max-w-sm">
        Takes under 2 minutes — your honest thoughts (good or bad) genuinely help us improve.
      </p>

      <div className="w-full max-w-sm space-y-5">
        <div>
          <label className="text-white text-sm font-bold block mb-1.5">
            1. Your child's age and class *
          </label>
          <input
            type="text"
            value={childAgeClass}
            onChange={(e) => setChildAgeClass(e.target.value)}
            placeholder="e.g. 9 years old, Primary 4"
            className="w-full bg-[#022C22] rounded-xl px-3 py-3 text-white placeholder-emerald-400 text-sm outline-none border border-emerald-800"
          />
        </div>

        <div>
          <label className="text-white text-sm font-bold block mb-1.5">
            2. Did the app work smoothly, or did anything break/confuse you?
          </label>
          <textarea
            value={workedSmoothly}
            onChange={(e) => setWorkedSmoothly(e.target.value)}
            placeholder="Tell us anything that felt off, or if it all worked well!"
            rows={3}
            className="w-full bg-[#022C22] rounded-xl px-3 py-3 text-white placeholder-emerald-400 text-sm outline-none border border-emerald-800 resize-none"
          />
        </div>

        <div>
          <label className="text-white text-sm font-bold block mb-1.5">
            3. Did Mama Titi actually help your child understand something?
          </label>
          <div className="flex gap-2">
            {['Yes', 'No', 'Not sure yet'].map((opt) => (
              <button
                key={opt}
                onClick={() => setHelpedUnderstanding(opt)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  helpedUnderstanding === opt
                    ? 'bg-[#FFC107] text-emerald-900'
                    : 'bg-[#022C22] text-emerald-200 border border-emerald-800'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-bold block mb-1.5">
            4. Would you consider paying ₦6,000/month for unlimited access?
          </label>
          <div className="flex gap-2">
            {['Yes', 'No', 'Maybe'].map((opt) => (
              <button
                key={opt}
                onClick={() => setWouldPay(opt)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  wouldPay === opt
                    ? 'bg-[#FFC107] text-emerald-900'
                    : 'bg-[#022C22] text-emerald-200 border border-emerald-800'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-bold block mb-1.5">
            5. Anything else you'd like to tell us?
          </label>
          <textarea
            value={otherComments}
            onChange={(e) => setOtherComments(e.target.value)}
            placeholder="Optional — anything at all"
            rows={3}
            className="w-full bg-[#022C22] rounded-xl px-3 py-3 text-white placeholder-emerald-400 text-sm outline-none border border-emerald-800 resize-none"
          />
        </div>

        {error && (
          <p className="text-center text-red-300 text-xs">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] rounded-xl py-3.5 font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Sending...' : (
            <>
              Send Feedback <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
