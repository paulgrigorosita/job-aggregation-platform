'use client';

import { useState } from 'react';
import { saveResume, type ResumeProfile, type WorkEntry, type EducationEntry, type ProjectEntry } from '@/lib/api';
import { Plus, Trash2, Save } from 'lucide-react';

const EMPTY: ResumeProfile = {
  name: 'Jane Example',
  email: 'jane@example.com',
  phone: '+1 555 000 0000',
  linkedinUrl: 'https://www.linkedin.com/in/jane-example',
  githubUrl: 'https://github.com/paulgrigorosita',
  portfolioUrl: 'https://example.com/',
  title: 'Senior Full Stack & AI Developer',
  summary: "Senior Full Stack Developer with 7+ years of experience building scalable SaaS platforms, AI-driven systems, and high-performance web applications. I use AI as a force multiplier across development, debugging, and optimization while keeping systems maintainable, reliable, and production-ready. Core stack: React, Next.js, React Native, Node.js, Python, TypeScript, PostgreSQL, Supabase, AWS, and modern AI tooling.",
  skills: [
    'TypeScript', 'JavaScript (ES6+)', 'Python', 'SQL',
    'React', 'Next.js', 'React Native', 'Angular', 'Tailwind CSS',
    'Node.js', 'Express.js', 'REST API', 'GraphQL', 'FastAPI',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase',
    'AWS', 'Docker', 'CI/CD', 'Serverless', 'Terraform',
    'LLM Integration', 'LangChain', 'RAG Pipelines', 'Prompt Engineering',
    'ETL Pipelines', 'Microservices', 'Distributed Systems', 'Performance Optimization',
    'Git', 'Agile/Scrum',
  ],
  workHistory: [
    {
      company: 'CoorWorks',
      duration: 'May 2024 – Feb 2026',
      title: 'Full Stack Developer',
      highlights: [
        'Built and maintained MEAN stack applications using Angular 18, Node.js, Express, and MongoDB, supporting 5,000+ concurrent users with sub-200ms latency',
        'Integrated AI automation workflows using GPT, Llama, LangChain, CrewAI, and custom RAG pipelines, reducing support response time by 40%',
        'Modernized architecture using microservices, serverless patterns, and event-driven queues with AWS Lambda, S3, DynamoDB, SQS, and CloudWatch',
        'Improved performance with Redis caching and optimized database queries across MongoDB and PostgreSQL',
        'Implemented CI/CD pipelines using GitHub Actions and Docker, delivering features 10–15% ahead of sprint timelines',
        'Applied Terraform for infrastructure automation across AWS and GCP environments',
      ],
    },
    {
      company: 'Phoenix Defense',
      duration: 'Jan 2022 – Apr 2024',
      title: 'Software Engineer',
      highlights: [
        'Refactored and optimized mission-critical defense systems across Node.js, Java, and .NET, reducing downtime by 30%',
        'Developed AI-based anomaly detection services using Python and FastAPI, improving detection accuracy to 95%',
        'Automated deployment workflows with Docker, Linux scripting, Azure DevOps, and AWS CodePipeline',
        'Built scalable APIs and event-driven services using Express, GraphQL, REST, AWS Lambda, and API Gateway',
        'Supported security hardening and compliance requirements in high-reliability environments',
      ],
    },
    {
      company: 'Tata Consultancy Services',
      duration: 'Jan 2021 – Dec 2021',
      title: 'Software Engineer',
      highlights: [
        'Built shopping platform using Java, JSP, SQL, React, and Spring Boot',
        'Led a team of 4–5 developers through Scrum workflows, planning, and delivery',
        'Integrated authentication, role-based access, and CRM features using Node.js, Express, and MySQL',
        'Created dashboards with React, Redux, and Material UI',
      ],
    },
    {
      company: 'Axosoft',
      duration: 'Jan 2020 – May 2020',
      title: 'Software Engineer',
      highlights: [
        'Improved performance of legacy systems, reducing code footprint by 15% and runtime by 10%',
        'Delivered new React and Redux features with improved UI responsiveness',
        'Built automated testing pipelines using Jest, Mocha, and Jenkins',
      ],
    },
  ],
  education: [
    {
      institution: 'Arizona State University',
      degree: "Master's Degree",
      field: 'Computer Science — Distributed Systems & Scalable Applications',
      duration: '2018 – 2020',
    },
    {
      institution: 'Arizona State University',
      degree: "Bachelor's Degree",
      field: 'Computer Science',
      duration: '2015 – 2018',
    },
  ],
  projects: [
    {
      name: 'DroneVision',
      url: '',
      description: 'AI-powered search and rescue platform using computer vision and real-time drone feeds to locate missing persons.',
      tech: ['Python', 'React', 'AWS', 'Computer Vision', 'FastAPI'],
    },
    {
      name: 'FinanceAI',
      url: '',
      description: 'Data-driven financial dashboard with AI-powered insights, forecasting, and anomaly detection for portfolio management.',
      tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'LLM Integration', 'Node.js'],
    },
    {
      name: 'TNT Cash & Logistics Operations Platform',
      url: '',
      description: 'High-volume cash and shipment workflow management system with role-based access, complex data imports, and real-time reporting.',
      tech: ['Angular 18', 'Node.js', 'MongoDB', 'AWS', 'Redis'],
    },
  ],
};

export function ResumeEditor({ initial }: { initial: ResumeProfile | null }) {
  const [form, setForm] = useState<ResumeProfile>(initial ?? EMPTY);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: keyof ResumeProfile, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Skills
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) set('skills', [...form.skills, s]);
    setSkillInput('');
  };
  const removeSkill = (s: string) => set('skills', form.skills.filter((x) => x !== s));

  // Work history
  const addWork = () =>
    set('workHistory', [...form.workHistory, { company: '', duration: '', title: '', highlights: [''] }]);
  const updateWork = (i: number, field: keyof WorkEntry, value: unknown) => {
    const wh = [...form.workHistory];
    wh[i] = { ...wh[i], [field]: value };
    set('workHistory', wh);
  };
  const removeWork = (i: number) => set('workHistory', form.workHistory.filter((_, idx) => idx !== i));
  const addHighlight = (i: number) => updateWork(i, 'highlights', [...form.workHistory[i].highlights, '']);
  const updateHighlight = (wi: number, hi: number, val: string) => {
    const hl = [...form.workHistory[wi].highlights];
    hl[hi] = val;
    updateWork(wi, 'highlights', hl);
  };
  const removeHighlight = (wi: number, hi: number) =>
    updateWork(wi, 'highlights', form.workHistory[wi].highlights.filter((_, idx) => idx !== hi));

  // Education
  const addEducation = () =>
    set('education', [...form.education, { institution: '', degree: '', field: '', duration: '' }]);
  const updateEducation = (i: number, field: keyof EducationEntry, value: string) => {
    const ed = [...form.education];
    ed[i] = { ...ed[i], [field]: value };
    set('education', ed);
  };
  const removeEducation = (i: number) => set('education', form.education.filter((_, idx) => idx !== i));

  // Projects
  const addProject = () =>
    set('projects', [...form.projects, { name: '', url: '', description: '', tech: [] }]);
  const updateProject = (i: number, field: keyof ProjectEntry, value: unknown) => {
    const ps = [...form.projects];
    ps[i] = { ...ps[i], [field]: value };
    set('projects', ps);
  };
  const removeProject = (i: number) => set('projects', form.projects.filter((_, idx) => idx !== i));
  const updateProjectTech = (pi: number, val: string) =>
    updateProject(pi, 'tech', val.split(',').map((t) => t.trim()).filter(Boolean));

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
  const sectionCls = 'bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700';

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <section className={sectionCls}>
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Personal Info</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name', field: 'name', placeholder: 'Jane Smith' },
            { label: 'Professional Title', field: 'title', placeholder: 'Full-Stack Engineer' },
            { label: 'Email', field: 'email', placeholder: 'jane@example.com' },
            { label: 'Phone', field: 'phone', placeholder: '+1 555 000 0000' },
            { label: 'LinkedIn URL', field: 'linkedinUrl', placeholder: 'https://linkedin.com/in/...' },
            { label: 'GitHub URL', field: 'githubUrl', placeholder: 'https://github.com/...' },
            { label: 'Portfolio URL', field: 'portfolioUrl', placeholder: 'https://yoursite.com' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <input
                className={inputCls}
                value={(form[field as keyof ResumeProfile] as string) ?? ''}
                onChange={(e) => set(field as keyof ResumeProfile, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelCls}>Summary</label>
          <textarea
            className={inputCls + ' resize-none h-28'}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            placeholder="2-3 sentence professional summary..."
          />
        </div>
      </section>

      {/* Skills */}
      <section className={sectionCls}>
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Skills</h2>
        <div className="flex gap-2 mb-3">
          <input
            className={inputCls}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Type a skill and press Enter"
          />
          <button onClick={addSkill} className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
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
      <section className={sectionCls}>
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
                <button onClick={() => removeWork(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>Company <span className="text-violet-500">(locked — Claude won&apos;t change)</span></label>
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
                      <input className={inputCls} value={h} onChange={(e) => updateHighlight(i, hi, e.target.value)} placeholder="Led migration to microservices..." />
                      <button onClick={() => removeHighlight(i, hi)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
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

      {/* Education */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Education</h2>
          <button onClick={addEducation} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-4">
          {form.education.map((ed, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Entry {i + 1}</span>
                <button onClick={() => removeEducation(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Institution</label>
                  <input className={inputCls} value={ed.institution} onChange={(e) => updateEducation(i, 'institution', e.target.value)} placeholder="Arizona State University" />
                </div>
                <div>
                  <label className={labelCls}>Duration</label>
                  <input className={inputCls} value={ed.duration} onChange={(e) => updateEducation(i, 'duration', e.target.value)} placeholder="2018 – 2020" />
                </div>
                <div>
                  <label className={labelCls}>Degree</label>
                  <input className={inputCls} value={ed.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} placeholder="Master's Degree" />
                </div>
                <div>
                  <label className={labelCls}>Field of Study</label>
                  <input className={inputCls} value={ed.field} onChange={(e) => updateEducation(i, 'field', e.target.value)} placeholder="Computer Science" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Projects</h2>
          <button onClick={addProject} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
            <Plus size={14} /> Add Project
          </button>
        </div>
        <div className="space-y-4">
          {form.projects.map((p, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Project {i + 1}</span>
                <button onClick={() => removeProject(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Project Name</label>
                  <input className={inputCls} value={p.name} onChange={(e) => updateProject(i, 'name', e.target.value)} placeholder="DroneVision" />
                </div>
                <div>
                  <label className={labelCls}>URL (optional)</label>
                  <input className={inputCls} value={p.url ?? ''} onChange={(e) => updateProject(i, 'url', e.target.value)} placeholder="https://github.com/..." />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls + ' resize-none h-16'} value={p.description} onChange={(e) => updateProject(i, 'description', e.target.value)} placeholder="What it does and why it matters..." />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Tech Stack (comma separated)</label>
                  <input className={inputCls} value={p.tech.join(', ')} onChange={(e) => updateProjectTech(i, e.target.value)} placeholder="React, Python, AWS" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pb-8">
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
