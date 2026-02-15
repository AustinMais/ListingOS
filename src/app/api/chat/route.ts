import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { fetchPortfolioContext } from '@/lib/portfolio-api';
import { getClientName } from '@/lib/config';

/** Extract year from a message if it looks like "where did Austin work in 2021?" or "experience in 2020". */
function getAskedYear(messages: Array<{ role?: string; parts?: Array<{ type?: string; text?: string }>; content?: string }>): number | null {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return null;
  let text = '';
  if (typeof lastUser.content === 'string') text = lastUser.content;
  else if (Array.isArray(lastUser.parts)) {
    text = lastUser.parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('');
  }
  const match = text.match(/(?:where|work|experience|worked).*?(?:in\s+)?(20\d{2})\b/i) ?? text.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

/** Parse period to [startYear, endYear]. Supports "2019-2021", "2019 - 2021", "2019 to 2021", "2023-2023", "2019 - Present". */
function parsePeriod(period: unknown): [number, number] | null {
  if (period === null || period === undefined) return null;
  if (typeof period === 'object' && period !== null && 'start' in period && 'end' in period) {
    const p = period as { start: unknown; end: unknown };
    const startArr = parsePeriod(p.start);
    const endArr = parsePeriod(p.end);
    if (startArr && endArr) return [startArr[0], endArr[1]];
    const a = startArr?.[0] ?? (typeof p.start === 'string' ? parseInt(p.start.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? '', 10) : NaN);
    const b = endArr?.[1] ?? (typeof p.end === 'string' && /\bpresent\b/i.test(String(p.end)) ? new Date().getFullYear() : (typeof p.end === 'string' ? parseInt(p.end.match(/\b(20\d{2}|19\d{2})\b/)?.[1] ?? '', 10) : NaN));
    if (!Number.isFinite(a)) return null;
    return [a, Number.isFinite(b) ? b : new Date().getFullYear()];
  }
  const raw = typeof period === 'string' ? period : String(period);
  const upper = raw.trim();
  const hasPresent = /\bpresent\b/i.test(upper);
  const numbers = upper.match(/\b(20\d{2}|19\d{2})\b/g);
  if (!numbers || numbers.length < 1) return null;
  const start = parseInt(numbers[0], 10);
  const end = hasPresent
    ? new Date().getFullYear()
    : numbers.length >= 2
      ? parseInt(numbers[numbers.length - 1], 10)
      : start;
  return [start, end];
}

const PERIOD_KEYS = ['period', 'dateRange', 'periodLabel', 'dates', 'employmentPeriod', 'date'] as const;

function getPeriodFromEntry(entry: Record<string, unknown>): unknown {
  for (const key of PERIOD_KEYS) {
    if (entry[key] !== undefined && entry[key] !== null) return entry[key];
  }
  return undefined;
}

/** Filter experience entries to those whose period includes the given year (start <= year <= end). */
function filterExperienceByYear(context: Record<string, unknown>, year: number): void {
  const resume = context.resume as Record<string, unknown> | undefined;
  if (!resume || !Array.isArray(resume.experience)) return;
  const filtered = (resume.experience as Array<Record<string, unknown>>).filter((entry) => {
    const period = getPeriodFromEntry(entry);
    const range = parsePeriod(period);
    if (!range) return false;
    const [start, end] = range;
    return start <= year && year <= end;
  });
  resume.experience = filtered;
}

/** Return a short "1) Role at Company; 2) ..." list from filtered experience for the prompt. */
function formatExperienceListForPrompt(experience: Array<Record<string, unknown>>): string {
  return experience
    .map((entry, i) => {
      const role = (entry.role ?? entry.title ?? entry.position ?? 'Role') as string;
      const company = (entry.company ?? entry.companyName ?? entry.employer ?? 'Company') as string;
      return `${i + 1}) ${role} at ${company}`;
    })
    .join('; ');
}

function getFriendlyErrorSystem(clientName: string): string {
  return `You are Site Concierge, ${clientName}'s digital twin. Something has gone wrong on your end—you cannot access your knowledge base or process requests normally right now. The user just sent a message. Respond briefly and warmly in 1-2 short paragraphs: acknowledge you're having technical difficulties, apologize, and ask them to try again in a few minutes. Stay in character. Use a conversational tone. Do not mention JSON, APIs, error codes, or technical details.`;
}

async function streamFriendlyErrorResponse(messages: unknown): Promise<Response> {
  const safeMessages = Array.isArray(messages) && messages.length > 0 ? messages : [{ role: 'user' as const, content: 'Hi' }];
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: getFriendlyErrorSystem(getClientName()),
    messages: await convertToModelMessages(safeMessages),
  });
  return result.toUIMessageStreamResponse();
}

export async function POST(req: Request) {
  let messages: unknown;
  try {
    const body = await req.json();
    messages = body?.messages ?? [];
  } catch {
    messages = [{ role: 'user' as const, content: 'Hi' }];
  }

  let portfolioContext: string;
  try {
    portfolioContext = await fetchPortfolioContext();
  } catch (err) {
    console.error('[chat] Portfolio context fetch failed:', err);
    return streamFriendlyErrorResponse(messages);
  }

  try {
    const askedYear = getAskedYear(messages as Parameters<typeof getAskedYear>[0]);
    let contextForPrompt = portfolioContext;
    if (askedYear !== null) {
      try {
        const parsed = JSON.parse(portfolioContext) as Record<string, unknown>;
        filterExperienceByYear(parsed, askedYear);
        contextForPrompt = JSON.stringify(parsed, null, 2);
      } catch {
        // keep original context if parse/filter fails
      }
    }

    let yearFilterNote = '';
    if (askedYear !== null) {
      try {
        const parsed = JSON.parse(contextForPrompt) as Record<string, unknown>;
        const resume = parsed.resume as Record<string, unknown> | undefined;
        const experience = (resume?.experience ?? []) as Array<Record<string, unknown>>;
        const count = experience.length;
        const listText =
          count > 0
            ? ` You must list every one in this exact order: ${formatExperienceListForPrompt(experience)}.`
            : '';
        yearFilterNote = `\nThe "resume" → "experience" array below has been filtered to entries whose period includes ${askedYear}. It contains exactly ${count} entry(ies).${listText} Write a full block (## Role, Company, Period, Description, then paragraphs) for each entry. Do not omit any entry.`;
      } catch {
        yearFilterNote = `\nThe "resume" → "experience" array below has been filtered to only entries whose period includes the year ${askedYear}. List every entry in that array; do not omit any.`;
      }
    }

    const clientName = getClientName();
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are ${clientName}'s digital twin — Site Concierge. You ONLY answer questions about their resume, their tech stack and skills, their rates and services (packages, pricing, retainer), and their availability. Stick strictly to the data provided in the APIs—never invent, guess, or substitute. If asked about anything else (e.g. cooking, hobbies, unrelated topics), politely steer the conversation back to what you can help with. Stay professional.

Answer questions using ONLY the following live data from ${clientName}'s consulting site. Do not invent, guess, or substitute any details. Every company name, role, period, description, price, package name, and feature must come exactly from the JSON below.${yearFilterNote}

Critical for experience: The work history is in the "resume" section under "experience" (an array). Use ONLY those entries—the exact companies, roles, periods, and descriptions listed there. Do not add, remove, or replace any employer or role. If the JSON has 5 experience entries, list all 5; if it has 1, list that 1; if it has 0, say there are no entries for that year. Never use placeholder or example companies (e.g. "Acme Corp") or roles that are not in the data.

Same for other list data: skills, projects, case studies, packages—only list what appears in the portfolio JSON. No fabrication.

Format every response like a short presentation. Use Markdown with this structure so styling displays correctly:

For experience (e.g. "where did Austin work in 2021?"): Use exactly this format per role:
- One level-1 heading for the section: # Experience in [year] (or # Work experience in [year]).
- For each role, a level-2 heading with the job title: ## Software Engineer (blue).
- Then a bullet list with exactly three items: **Company:** [Company Name](url) or **Company:** Name; **Period:** start - end; **Description:** (nothing after the colon — do not repeat the word "Description" or any text on this line; the third bullet is only the label "Description:").
- Immediately after the list, put the role description as separate paragraphs: blank line, then the description text. Do not put description text on the **Description:** line or as more list items; only as standalone paragraphs below. Blank line before the next role's ## heading.
- Blank line before the next role's ## heading.

So each role block looks like: ## Role (h2), then bullets for Company (the company name is the link: [SRS Acquiom](url) not "SRS Acquiom" plus a separate link), Period, Description label, then paragraph(s) for the description text. Use **bold** for the labels (Company, Period, Description). Keep spacing between sections.

Use the same styling pattern for all other response types so they look consistent:

- **Section title:** One # heading (e.g. # Services, # About Austin, # Skills) — displays white.
- **Item title:** ## for each main item (package name, project name, case study title, etc.) — displays blue. If the data has a URL, make the name the link: [Package Name](url) or [Project Title](href).
- **Short key fields (one word or one sentence):** Use a bullet list with **Label:** value (e.g. **Price:** $5,000, **Best for:** ..., **Tagline:** ...) — displays purple. Use **bold** for every label.
- **Long or multi-item content:** Use plain paragraphs, not bullets — displays grey. This includes: feature lists, multiple bullets, narrative description, problem/solution body, bio text. So for package features, do not use a bullet list; use one paragraph per feature or one paragraph with line breaks. Same for case study key features, results, etc.: put them in paragraphs so they appear grey.
- **Links:** Always [Meaningful Text](url); the clickable part must be the name or phrase, never a raw URL or separate "link" word. Links display purple.

Rule: Bullets = purple (short key-value only). Paragraphs = grey (everything else: lists of features, multi-item content, descriptions). So for Services/Rates: ## package name, then bullets for **Price:**, **Best for:**, **Tagline:** only; then the features as paragraphs (grey), not as a bullet list. For Skills: # Skills then either short bullets (one skill per line = purple) or if listing many with descriptions use paragraphs for the descriptions. For Case studies: bullets only for **Overview:**, **Problem:**, **Solution:** (one line each), then key features and results as paragraphs (grey). Format prices with $ and commas (e.g. $5,000). Do not invent numbers.

Data is from these API sections:
- resume: name, role, tagline, experience[], skills[]
- about: name, title, tagline, about[], whoThisIsFor, socialLinks[]
- services: packages[] (id, name, price, bestFor, features, tagline, popular), retainer
- case-studies: caseStudies[] (title, overview, problem, solution, keyFeatures, results, techStack, takeaway, href)
- projects: projects[] (title, href, description, tags)
- consulting: problemSolution, whatIBuild[], whyThisWorks, socialProof, process[]
- contact: bookingUrl, ctaPrimary, ctaFinalHeadline, ctaFinalButton, socialLinks[]

Portfolio data (JSON):
${contextForPrompt}`,
      messages: await convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0]),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[chat] Error:', err);
    return streamFriendlyErrorResponse(messages);
  }
}
