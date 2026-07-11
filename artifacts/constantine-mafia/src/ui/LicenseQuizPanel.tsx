/**
 * LicenseQuizPanel — Driving License test at the Ali Mendjeli Garage DMV desk.
 *
 * Completes a previously-stubbed feature: `NpcTalker.quiz` and
 * `activePanel: 'license_quiz'` already existed in the store/types, and the
 * question bank (DRIVING_LICENSE_QUIZ) already existed in items.ts, but no
 * panel ever consumed them — pressing [E] on the examiner just showed a
 * static dialogue line and did nothing. This wires the existing pieces
 * together instead of building a new system.
 */
import React, { useMemo, useState } from 'react';
import { useGameStore } from '../game/useGameStore';
import { DRIVING_LICENSE_QUIZ, DRIVING_LICENSE_ID, type QuizQuestion } from '../game/items';

const QUESTIONS_PER_ATTEMPT = 3;
const PASS_THRESHOLD = 2; // correct answers needed to pass

function pickQuestions(): QuizQuestion[] {
  const pool = [...DRIVING_LICENSE_QUIZ];
  const picked: QuizQuestion[] = [];
  while (picked.length < QUESTIONS_PER_ATTEMPT && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

export function LicenseQuizPanel() {
  const store = useGameStore();
  const [questions] = useState<QuizQuestion[]>(pickQuestions);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);

  const alreadyLicensed = store.ownedAssetIds.includes(DRIVING_LICENSE_ID);
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const close = () => {
    store.setPlayerState({ isPaused: false, activePanel: 'none' });
  };

  const submit = () => {
    const correct = questions.filter((q) => answers[q.id] === q.answer).length;
    if (correct >= PASS_THRESHOLD) {
      const newOwned = store.ownedAssetIds.includes(DRIVING_LICENSE_ID)
        ? store.ownedAssetIds
        : [...store.ownedAssetIds, DRIVING_LICENSE_ID];
      store.setPlayerState({ ownedAssetIds: newOwned });
      setResult('pass');
    } else {
      setResult('fail');
    }
  };

  if (alreadyLicensed && !result) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-4xl">🪪</div>
        <p className="text-white/90 text-sm">You already hold a valid Driving License.</p>
        <button
          onClick={close}
          className="px-6 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition"
        >
          Close
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-4xl">{result === 'pass' ? '✅' : '❌'}</div>
        <p className="text-white/90 text-sm font-semibold">
          {result === 'pass'
            ? 'Test passed — your Driving License has been issued!'
            : 'Test failed — you can try again anytime.'}
        </p>
        <button
          onClick={close}
          className="px-6 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5 max-w-lg mx-auto">
      <div>
        <h3 className="text-primary font-black text-sm uppercase tracking-widest">🪪 Driving License Test</h3>
        <p className="text-gray-500 text-xs mt-1">
          Answer at least {PASS_THRESHOLD} of {questions.length} correctly to pass.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        {questions.map((q, qi) => (
          <div key={q.id} className="space-y-2">
            <p className="text-white/90 text-sm font-medium">{qi + 1}. {q.q}</p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                  className={`text-left text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                    answers[q.id] === oi
                      ? 'border-primary/60 text-primary bg-primary/10'
                      : 'border-white/12 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered}
        onClick={submit}
        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
          allAnswered
            ? 'bg-primary text-black hover:bg-primary/90'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        Submit Test
      </button>
    </div>
  );
}
