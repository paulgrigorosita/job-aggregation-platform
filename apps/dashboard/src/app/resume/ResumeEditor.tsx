'use client';

import { useState } from 'react';
import { saveResume, type ResumeProfile, type WorkEntry } from '@/lib/api';
import { Plus, Trash2, Save } from 'lucide-react';

const EMPTY: ResumeProfile = {
  name: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  githubUrl: '',
  title: '',
  summary: '',
  skills: [],
  workHistory: [],
};

export function ResumeEditor({ initial }: { initial: ResumeProfile | null }) {
  const [form, setForm] = useState<ResumeProfile>(initial ?? EMPTY);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: keyof ResumeProfile, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) set('skills', [...form.skills, s]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => set('skills', form.skills.filter((x) => x !== s));

  const addWork = () =>
    set('workHistory', [
      ...form.workHistory,
      { company: '', duration: '', title: '', highlights: [''] },
    ]);

  const updateWork = (i: number, field: keyof WorkEntry, value: unknown) => {
    const wh = [...form.workHistory];
    wh[i] = { ...wh[i], [field]: value };
    set('workHistory', wh);
  };

  const removeWork = (i: number) =>
    set('workHistory', form.workHistory.filter((_, idx) => idx !== i));

  const addHighlight = (i: number) => updateWork(i, 'highlights', [...form.workHistory[i].highlights, '']);

  const updateHighlight = (wi: number, hi: number, val: string) => {
    const hl = [...form.workHistory[wi].highlights];
    hl[hi] = val;
    updateWork(wi, 'highlights', hl);
  };

  const removeHighlight = (wi: number, hi: number) =>
    updateWork(wi, 'highlights', form.workHistory[wi].highlights.filter((_, idx) => idx !== hi));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveResume(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Personal Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={labelCls}>Professional Title</label>
            <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Full-Stack Engineer" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <label className={labelCls}>LinkedIn URL</label>
            <input className={inputCls} value={form.linkedinUrl ?? ''} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className={labelCls}>GitHub URL</label>
            <input className={inputCls} value={form.githubUrl ?? ''} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/..." />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Summary</label>
          <textarea
            className={inputCls + ' resize-none h-24'}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="2-3 sentence professional summary..."
          />
        </div>
      </section>

      {/* Skills */}
      <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Skills</h2>
        <div className="flex gap-2 mb-3">
          <input
            className={inputCls}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Type a skill and press Enter"
          />
          <button onClick={addSkill} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.skills.map((s) => (
            <span key={s} className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {s}
              <button onClick={() => removeSkill(s)} className="text-slate-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </section>

      {/* Work History */}
      <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Work History</h2>
          <button onClick={addWork} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
            <Plus size={14} /> Add Role
          </button>
        </div>
        <div className="space-y-6">
          {form.workHistory.map((w, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-slate-400">Role {i + 1}</span>
                <button onClick={() => removeWork(i)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Company <span className="text-violet-500">(locked — Claude won&apos;t change this)</span></label>
                  <input className={inputCls} value={w.company} onChange={(e) => updateWork(i, 'company', e.target.value)} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className={labelCls}>Duration <span className="text-violet-500">(locked)</span></label>
                  <input className={inputCls} value={w.duration} onChange={(e) => updateWork(i, 'duration', e.target.value)} placeholder="2021 – 2024" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Title</label>
                  <input className={inputCls} value={w.title} onChange={(e) => updateWork(i, 'title', e.target.value)} placeholder="Software Engineer" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Highlights</label>
                <div className="space-y-2">
                  {w.highlights.map((h, hi) => (
                    <div key={hi} className="flex gap-2">
                      <input
                        className={inputCls}
                        value={h}
                        onChange={(e) => updateHighlight(i, hi, e.target.value)}
                        placeholder="Led migration of monolith to microservices..."
                      />
                      <button onClick={() => removeHighlight(i, hi)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addHighlight(i)} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add highlight
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          <Save size={16} />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Resume'}
        </button>
      </div>
    </div>
  );
}
