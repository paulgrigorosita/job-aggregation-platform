import { fetchResume } from '@/lib/api';
import { ResumeEditor } from './ResumeEditor';
import { ApplicationAnswersEditor } from './ApplicationAnswersEditor';

export default async function ResumePage() {
  let resume = null;
  try {
    resume = await fetchResume();
  } catch {}

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Resume</h1>
        <p className="text-slate-500 mt-1 text-sm">
          This base profile is used to generate tailored resumes for each job you apply to.
        </p>
      </div>
      <ResumeEditor initial={resume} />
      <ApplicationAnswersEditor resume={resume} />
    </div>
  );
}
