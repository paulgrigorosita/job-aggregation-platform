import puppeteer, { type Page } from 'puppeteer';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { db } from '@jap/database';
import { createLogger, APPLICATION_ANSWER_FIELDS, type ApplicationAnswers } from '@jap/shared';

const logger = createLogger('worker:apply');

interface WorkEntry {
  company: string;
  duration: string;
  title: string;
  highlights: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  duration: string;
}

interface ProjectEntry {
  name: string;
  url?: string;
  description: string;
  tech: string[];
}

interface ResumeData {
  name: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  title: string;
  summary: string;
  skills: string[];
  workHistory: WorkEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
}

function buildResumeHTML(resume: ResumeData): string {
  const nameParts = resume.name.split(' ');
  const contact = `
    <table class="contact-table">
      <tr>
        <td>&#x1F4CD; Anytown, AZ, 85000</td>
        ${resume.linkedinUrl ? `<td><span class="contact-label">LinkedIn:</span> <a href="${resume.linkedinUrl}">${resume.linkedinUrl.replace('https://', '')}</a></td>` : '<td></td>'}
      </tr>
      <tr>
        <td>&#9993; <a href="mailto:${resume.email}">${resume.email}</a></td>
        ${resume.githubUrl ? `<td><span class="contact-label">GitHub:</span> <a href="${resume.githubUrl}">${resume.githubUrl.replace('https://', '')}</a></td>` : '<td></td>'}
      </tr>
      <tr>
        <td>&#9990; ${resume.phone}</td>
        ${resume.portfolioUrl ? `<td><span class="contact-label">Portfolio:</span> <a href="${resume.portfolioUrl}">${resume.portfolioUrl.replace('https://', '')}</a></td>` : '<td></td>'}
      </tr>
    </table>`;

  const workHTML = resume.workHistory.map(w => `
    <div class="role">
      <div class="role-header">
        <span class="role-company">${w.company}</span>
        <span class="role-duration">${w.duration}</span>
      </div>
      <div class="role-title">${w.title}</div>
      <ul>${w.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
    </div>`).join('');

  const projectsHTML = resume.projects?.length ? `
    <div class="section-title">Projects</div>
    ${resume.projects.map(p => `
      <div class="project">
        <span class="project-name">${p.name}</span>${p.url ? ` &mdash; <a href="${p.url}" class="link">${p.url}</a>` : ''}
        <div class="project-desc">${p.description}</div>
        <div class="project-tech">${p.tech.join(' &middot; ')}</div>
      </div>`).join('')}` : '';

  const educationHTML = resume.education?.length ? `
    <div class="section-title">Education</div>
    ${resume.education.map(ed => `
      <div class="edu-row">
        <div>
          <div class="edu-inst">${ed.institution}</div>
          <div class="edu-detail">${ed.degree} &mdash; ${ed.field}</div>
        </div>
        <div class="edu-duration">${ed.duration}</div>
      </div>`).join('')}` : '';

  const skillsHTML = resume.skills.map(s => `<span class="skill">${s}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1a1a1a; padding: 36px 44px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24pt; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 3px; }
    .title { font-size: 12pt; color: #5b21b6; font-weight: 600; margin-bottom: 6px; }
    .contact-table { width: 100%; border-collapse: collapse; font-size: 9pt; color: #444; margin-bottom: 18px; }
    .contact-table td { padding: 1.5px 0; width: 50%; vertical-align: top; }
    .contact-table a { color: #1a1a1a; text-decoration: none; }
    .contact-label { font-weight: 600; color: #1a1a1a; }
    .divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 0 0 14px; }
    .section-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin: 16px 0 8px; }
    .summary { color: #333; font-size: 10pt; line-height: 1.6; }
    .skills { display: flex; flex-wrap: wrap; gap: 5px; }
    .skill { background: #f3f0ff; color: #5b21b6; padding: 2px 9px; border-radius: 999px; font-size: 9pt; font-weight: 500; }
    .role { margin-bottom: 12px; }
    .role-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
    .role-company { font-weight: 700; font-size: 10.5pt; }
    .role-duration { font-size: 9pt; color: #888; }
    .role-title { font-size: 9.5pt; color: #5b21b6; font-weight: 600; margin-bottom: 4px; }
    ul { padding-left: 14px; }
    li { margin-bottom: 2px; color: #333; font-size: 10pt; }
    .project { margin-bottom: 10px; }
    .project-name { font-weight: 700; font-size: 10.5pt; }
    .link { color: #5b21b6; font-size: 9pt; text-decoration: none; }
    .project-desc { color: #444; font-size: 9.5pt; margin-top: 2px; }
    .project-tech { font-size: 9pt; color: #888; margin-top: 2px; }
    .edu-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .edu-inst { font-weight: 700; font-size: 10.5pt; }
    .edu-detail { font-size: 9.5pt; color: #555; margin-top: 1px; }
    .edu-duration { font-size: 9pt; color: #888; white-space: nowrap; margin-left: 12px; }
    @page { margin: 0.5in; size: letter; }
  </style>
</head>
<body>
  <h1>${resume.name}</h1>
  <div class="title">${resume.title}</div>
  ${contact}
  <hr class="divider"/>
  <div class="section-title">Summary</div>
  <div class="summary">${resume.summary}</div>
  <div class="section-title">Skills</div>
  <div class="skills">${skillsHTML}</div>
  <div class="section-title">Work History</div>
  ${workHTML}
  ${projectsHTML}
  ${educationHTML}
</body>
</html>`;
}

async function fillField(page: Page, selector: string, value: string) {
  const el = await page.$(selector);
  if (!el) return;
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 20 });
}

interface QuestionField {
  idx: number;
  labelText: string;
  kind: 'text' | 'textarea' | 'select' | 'options' | 'combobox';
  optionLabels?: string[];
}

const FIELD_MARKER = 'data-apply-idx';

async function fillSavedAnswers(page: Page, answers: ApplicationAnswers, logger: ReturnType<typeof createLogger>) {
  const compiledPatterns = APPLICATION_ANSWER_FIELDS
    .filter((f) => answers[f.key])
    .map((f) => ({ key: f.key, regex: new RegExp(f.questionPattern, 'i'), value: String(answers[f.key]) }));

  const customAnswers = (answers.customAnswers ?? []).filter((qa) => qa.question && qa.answer);

  const fields: QuestionField[] = await page.evaluate((marker) => {
    const out: Array<{ idx: number; labelText: string; kind: string; optionLabels?: string[] }> = [];
    const containers = document.querySelectorAll('.field, [class*="field"], fieldset');
    containers.forEach((container, idx) => {
      const label = container.querySelector('label');
      if (!label) return;
      const labelText = (label.textContent ?? '').trim();
      if (!labelText) return;

      const select = container.querySelector('select');
      const textarea = container.querySelector('textarea');
      const textInput = container.querySelector(
        'input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):not([type="hidden"]):not([type="submit"]):not([type="button"])'
      );
      const options = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      const combobox = container.querySelector('[role="combobox"], [class*="select__control"], [class*="Select-control"], [aria-haspopup="listbox"]');

      let kind: string | null = null;
      let optionLabels: string[] | undefined;

      if (select) {
        kind = 'select';
        optionLabels = Array.from(select.querySelectorAll('option')).map((o) => (o.textContent ?? '').trim());
      } else if (options.length > 0) {
        kind = 'options';
        optionLabels = Array.from(options).map((o) => {
          const id = o.getAttribute('id');
          const optLabel = id ? container.querySelector(`label[for="${id}"]`) : null;
          return (optLabel?.textContent ?? o.getAttribute('value') ?? '').trim();
        });
      } else if (combobox) {
        kind = 'combobox';
      } else if (textarea) {
        kind = 'textarea';
      } else if (textInput) {
        kind = 'text';
      }

      if (!kind) return;
      container.setAttribute(marker, String(idx));
      out.push({ idx, labelText, kind, optionLabels });
    });
    return out;
  }, FIELD_MARKER) as QuestionField[];

  for (const field of fields) {
    let value: string | undefined;

    const matched = compiledPatterns.find((p) => p.regex.test(field.labelText));
    if (matched) {
      value = matched.value;
    } else {
      const custom = customAnswers.find((qa) => field.labelText.toLowerCase().includes(qa.question.toLowerCase()));
      if (custom) value = custom.answer;
    }

    if (!value) continue;

    const containerSel = `[${FIELD_MARKER}="${field.idx}"]`;

    try {
      if (field.kind === 'text') {
        await fillField(page, `${containerSel} input`, value);
      } else if (field.kind === 'textarea') {
        const el = await page.$(`${containerSel} textarea`);
        if (el) {
          await el.click({ clickCount: 3 });
          await el.type(value, { delay: 10 });
        }
      } else if (field.kind === 'select') {
        const select = await page.$(`${containerSel} select`);
        if (select) {
          await page.evaluate((sel, val, marker, idx) => {
            const container = document.querySelector(`[${marker}="${idx}"]`);
            const selectEl = container?.querySelector('select');
            if (!selectEl) return;
            const target = Array.from(selectEl.options).find((o) =>
              (o.textContent ?? '').trim().toLowerCase().includes(val.toLowerCase())
            );
            if (target) {
              selectEl.value = target.value;
              selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, containerSel, value, FIELD_MARKER, field.idx);
        }
      } else if (field.kind === 'combobox') {
        const trigger = await page.$(
          `${containerSel} [role="combobox"], ${containerSel} [class*="select__control"], ${containerSel} [class*="Select-control"], ${containerSel} [aria-haspopup="listbox"]`
        );
        if (trigger) {
          await trigger.click();
          await new Promise((r) => setTimeout(r, 400));

          // Some comboboxes are searchable — typing narrows the rendered option list
          const searchInput = await page.$(`${containerSel} input[type="text"], ${containerSel} input:not([type])`);
          if (searchInput) await searchInput.type(value, { delay: 20 });
          await new Promise((r) => setTimeout(r, 400));

          const optionHandles = await page.$$('[role="option"], [class*="select__option"], [class*="Select-option"], li[id*="option"]');
          let clicked = false;
          for (const opt of optionHandles) {
            const text = await opt.evaluate((el) => (el.textContent ?? '').trim().toLowerCase());
            if (text && text.includes(value.toLowerCase())) {
              await opt.click();
              clicked = true;
              break;
            }
          }
          if (!clicked) await page.keyboard.press('Escape');
        }
      } else if (field.kind === 'options' && field.optionLabels) {
        const matchIdx = field.optionLabels.findIndex((l) => l.toLowerCase().includes(value!.toLowerCase()));
        if (matchIdx >= 0) {
          const inputs = await page.$$(`${containerSel} input[type="radio"], ${containerSel} input[type="checkbox"]`);
          const target = inputs[matchIdx];
          if (target) await target.click();
        }
      }
    } catch (err) {
      logger.warn({ labelText: field.labelText, err }, 'Failed to fill saved answer for field');
    }
  }
}

export function screenshotPath(jobId: string) {
  return join('/tmp', `apply_preview_${jobId}.png`);
}

export async function applyToJob(jobId: string, dryRun = false): Promise<void> {
  const [job, baseResume] = await Promise.all([
    db.job.findUnique({ where: { id: jobId } }),
    db.resume.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  if (!job) throw new Error('Job not found');
  if (!baseResume) throw new Error('No base resume found. Please save your resume first.');

  const resume: ResumeData = job.tailoredResume
    ? (job.tailoredResume as ResumeData)
    : {
        name: baseResume.name,
        email: baseResume.email,
        phone: baseResume.phone,
        linkedinUrl: baseResume.linkedinUrl,
        githubUrl: baseResume.githubUrl,
        portfolioUrl: baseResume.portfolioUrl,
        title: baseResume.title,
        summary: baseResume.summary,
        skills: baseResume.skills as string[],
        workHistory: baseResume.workHistory as WorkEntry[],
        education: (baseResume.education ?? []) as EducationEntry[],
        projects: (baseResume.projects ?? []) as ProjectEntry[],
      };

  const nameParts = resume.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') ?? '';

  const pdfPath = join('/tmp', `resume_apply_${jobId}.pdf`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // Generate resume PDF
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(buildResumeHTML(resume), { waitUntil: 'networkidle0' });
    const pdfBuffer = await pdfPage.pdf({ format: 'Letter', printBackground: true });
    await pdfPage.close();
    await writeFile(pdfPath, pdfBuffer);

    // Navigate to apply page
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(job.applyUrl, { waitUntil: 'networkidle2', timeout: 30_000 });

    // If it's a Greenhouse job board listing (not the form), click Apply
    const applyLink = await page.$('a[href*="/applications/new"]');
    if (applyLink) {
      await applyLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15_000 });
    }

    // Fill standard fields
    await fillField(page, '#first_name', firstName);
    await fillField(page, '#last_name', lastName);
    await fillField(page, '#email', resume.email ?? '');
    await fillField(page, '#phone', resume.phone ?? '');

    // LinkedIn — Greenhouse uses name="job_application[urls][LinkedIn]"
    if (resume.linkedinUrl) {
      const li = await page.$('input[name*="LinkedIn"], input[name*="linkedin"]');
      if (li) {
        await li.click({ clickCount: 3 });
        await li.type(resume.linkedinUrl, { delay: 20 });
      }
    }

    // GitHub
    if (resume.githubUrl) {
      const gh = await page.$('input[name*="GitHub"], input[name*="github"]');
      if (gh) {
        await gh.click({ clickCount: 3 });
        await gh.type(resume.githubUrl, { delay: 20 });
      }
    }

    // Portfolio / website
    if (resume.portfolioUrl) {
      const pw = await page.$('input[name*="website"], input[name*="portfolio"], input[name*="Website"]');
      if (pw) {
        await pw.click({ clickCount: 3 });
        await pw.type(resume.portfolioUrl, { delay: 20 });
      }
    }

    // Fill in saved application answer defaults (recurring questions + custom Q&A)
    const applicationAnswers = (baseResume.applicationAnswers ?? {}) as ApplicationAnswers;
    await fillSavedAnswers(page, applicationAnswers, logger);

    // Upload resume PDF
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(pdfPath);
      // Wait for upload to process
      await new Promise(r => setTimeout(r, 2000));
    }

    // Screenshot the filled form before submitting
    await page.screenshot({ path: screenshotPath(jobId), fullPage: true });

    if (dryRun) {
      // Dry run: do not submit — screenshot is the deliverable
      await page.close();
      await db.job.update({
        where: { id: job.id },
        data: { applicationStatus: null, applyError: null },
      });
      logger.info({ jobId }, 'Dry-run complete — screenshot saved, form not submitted');
      return;
    }

    // Submit the form
    const submitBtn = await page.$('input[type="submit"][value*="ubmit"], button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => {
        // Some forms do SPA navigation, ignore timeout
      });
    }

    await page.close();

    await db.job.update({
      where: { id: job.id },
      data: { applicationStatus: 'APPLIED', appliedAt: new Date(), applyError: null },
    });

    logger.info({ jobId, title: job.title }, 'Successfully applied to job');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, err }, 'Failed to apply to job');
    await db.job.update({
      where: { id: job.id },
      data: { applicationStatus: 'FAILED', applyError: message },
    });
    throw err;
  } finally {
    await browser.close();
    await unlink(pdfPath).catch(() => {});
  }
}
