'use client';

import { useState } from 'react';
import { saveResume, type ResumeProfile, type ApplicationAnswers, type CustomQA } from '@/lib/api';
import { Save, Check, Plus, Trash2, ListChecks } from 'lucide-react';

const EMPTY_ANSWERS: ApplicationAnswers = {
  preferredFirstName: '',
  locationCity: '',
  zipCode: '',
  linkedinProfile: '',
  howHeardAboutUs: '',
  workAuthorized: '',
  requireSponsorship: '',
  genderIdentity: '',
  transgender: '',
  sexualOrientation: '',
  raceEthnicity: '',
  veteranStatus: '',
  disability: '',
  firstGenProfessional: '',
  coverLetter: '',
  customAnswers: [],
};

const TEXT_FIELDS: Array<{ key: keyof ApplicationAnswers; label: string; placeholder: string }> = [
  { key: 'preferredFirstName', label: 'Preferred First Name', placeholder: 'e.g. Paul' },
  { key: 'locationCity', label: 'Location (City)', placeholder: 'e.g. Anytown, AZ' },
  { key: 'zipCode', label: 'Zip / Postal Code', placeholder: 'e.g. 85000' },
  { key: 'linkedinProfile', label: 'LinkedIn Profile (separate field)', placeholder: 'https://linkedin.com/in/...' },
  { key: 'howHeardAboutUs', label: 'How did you hear about this opportunity?', placeholder: 'e.g. LinkedIn, Indeed, Company Website' },
  { key: 'workAuthorized', label: 'Are you legally authorized to work in the country where you are applying?', placeholder: 'e.g. Yes' },
  { key: 'requireSponsorship', label: 'Will you now or in the future require visa sponsorship?', placeholder: 'e.g. No' },
];

const SELF_ID_FIELDS: Array<{ key: keyof ApplicationAnswers; label: string; placeholder: string }> = [
  { key: 'genderIdentity', label: 'Gender identity', placeholder: 'e.g. Male' },
  { key: 'transgender', label: 'I identify as transgender', placeholder: 'e.g. No' },
  { key: 'sexualOrientation', label: 'Sexual orientation', placeholder: 'e.g. Heterosexual' },
  { key: 'raceEthnicity', label: 'Race / ethnicity', placeholder: 'e.g. White' },
  { key: 'veteranStatus', label: 'Veteran status', placeholder: 'e.g. I am not a protected veteran' },
  { key: 'disability', label: 'I have a disability', placeholder: 'e.g. No' },
  { key: 'firstGenProfessional', label: 'I am a first-generation professional', placeholder: 'e.g. No' },
];

export function ApplicationAnswersEditor({ resume }: { resume: ResumeProfile | null }) {
  const [answers, setAnswers] = useState<ApplicationAnswers>(resume?.applicationAnswers ?? EMPTY_ANSWERS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof ApplicationAnswers, value: unknown) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const customAnswers = answers.customAnswers ?? [];
  const addCustom = () => set('customAnswers', [...customAnswers, { question: '', answer: '' }]);
  const updateCustom = (i: number, field: keyof CustomQA, value: string) => {
    const next = [...customAnswers];
    next[i] = { ...next[i], [field]: value };
    set('customAnswers', next);
  };
  const removeCustom = (i: number) => set('customAnswers', customAnswers.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);
    try {
      await saveResume({ ...resume, applicationAnswers: answers });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';
  const sectionCls = 'bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700';

  if (!resume) {
    return (
      <div className="mt-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
        Save your base resume above first — application defaults are stored alongside it.
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ListChecks size={20} className="text-violet-500" />
          Application Answer Defaults
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Greenhouse applications repeatedly ask the same questions (work authorization, EEO/voluntary self-ID, how you heard
          about the role, etc.). Save your answers here once and Auto Apply will fill them in automatically on every application.
        </p>
      </div>

      <section className={sectionCls}>
        <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Common Questions</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {TEXT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input className={inputCls} value={(answers[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={labelCls}>Cover Letter (used when a free-text cover letter field appears)</label>
            <textarea className={inputCls + ' resize-none h-24'} value={answers.coverLetter ?? ''} onChange={(e) => set('coverLetter', e.target.value)} placeholder="Leave blank to skip cover letter fields" />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="font-semibold mb-1 text-slate-800 dark:text-slate-100">Voluntary Self-Identification</h3>
        <p className="text-xs text-slate-400 mb-4">
          These are personal, voluntary EEO disclosures. Save your preferred answers here so they&apos;re filled consistently —
          or leave blank to always answer &quot;Decline to self-identify&quot; / leave unanswered for manual review.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {SELF_ID_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input className={inputCls} value={(answers[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </section>

      <section className={sectionCls}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Custom Q&amp;A (for unexpected questions)</h3>
          <button onClick={addCustom} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
            <Plus size={14} /> Add
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          When Auto Apply meets a question it doesn&apos;t recognize, it tries to match it against these saved question/answer
          pairs (substring match, case-insensitive). Anything still unmatched is left blank for you to review in Preview Fill —
          add it here afterward so it&apos;s handled automatically next time.
        </p>
        <div className="space-y-3">
          {customAnswers.map((qa, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input className={inputCls} value={qa.question} onChange={(e) => updateCustom(i, 'question', e.target.value)} placeholder="Question text or keyword to match (e.g. 'salary expectations')" />
              <input className={inputCls} value={qa.answer} onChange={(e) => updateCustom(i, 'answer', e.target.value)} placeholder="Answer to fill in / option to select" />
              <button onClick={() => removeCustom(i)} className="text-slate-400 hover:text-red-500 mt-2 shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
          {customAnswers.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              No custom answers yet. Add one as you discover recurring company-specific questions.
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Application Answers'}
        </button>
      </div>
    </div>
  );
}
