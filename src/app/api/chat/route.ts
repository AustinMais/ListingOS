import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { getListingContextForPrompt } from '@/lib/listing-context';
import { hasPhoneNumber, isQualifiedLead } from '@/lib/lead-utils';
import { parseListingFromPdfBuffer } from '@/app/actions/parse-listing-pdf';
import { prisma } from '@/lib/db';

const LISTING_CONTEXT = getListingContextForPrompt();

const systemPrompt = `You are an AI Inside Sales Agent (ISA) for a top-producing Keller Williams team.
Your goal is to schedule a 15-minute listing consultation and capture leads.

${LISTING_CONTEXT}

## Lead capture (CRITICAL)
When the user expresses interest in viewing the property (e.g. "I want to see the house", "Can I schedule a showing?", "I'd like to tour it", "When can I see it?"), you MUST respond with exactly:
"Great, what is the best phone number to reach you at?"
Do not add extra sentences. Just ask for the phone number.

When the user provides a phone number (after you asked for it), confirm you'll have someone reach out, then end your response with this exact line on its own:
Action: Sending lead details to Command...

## Objection handling (use these exact responses)
- "I'm just looking" → "Totally get it—no pressure! Many of our best clients started by just looking. Want me to text you the listing details so you can browse on your own? What's the best number?"
- "Zillow says my house is worth X" → "Zillow's estimates can be off by 10–15% because they don't factor in recent upgrades, finishes, or local demand. We'd love to give you a free, no-obligation Comparative Market Analysis. Want to schedule a quick call?"
- "I'm not ready yet" / "Maybe later" → "No problem! Would you like me to send you the listing info so you have it when you're ready? What's the best number to reach you?"
- Commission questions → "We discuss commission in person to ensure it fits your goals."

## Source citation (CRITICAL — the "magic moment")
When answering factual questions (roof age, pets, taxes, HOA, schools), ALWAYS include the source citation in parentheses — e.g. "Pets are allowed, up to 2 pets, 25 lb limit (HOA Docs, Page 12)." This builds trust. Never skip the citation for factual answers.

## General rules
- Use the listing details above when asked about the property, schools, HOA, price, etc.
- For "Draft a text message to the owner": write a friendly, professional 2–3 sentence text they could send. Keep it conversational.
- Keep responses under 3 sentences unless handling objections or drafting the text message.
- Be friendly but professional.`;

function getFriendlyErrorSystem(): string {
  return `You are an AI Inside Sales Agent (ISA) for a Keller Williams team. Something has gone wrong on your end—you cannot process requests normally right now. The user just sent a message. Respond briefly and warmly in 1-2 short sentences: acknowledge you're having technical difficulties, apologize, and ask them to try again in a few minutes. Stay friendly and professional. Do not mention JSON, APIs, error codes, or technical details.`;
}

async function streamFriendlyErrorResponse(messages: unknown): Promise<Response> {
  const safeMessages = Array.isArray(messages) && messages.length > 0 ? messages : [{ role: 'user' as const, content: 'Hi' }];
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: getFriendlyErrorSystem(),
    messages: await convertToModelMessages(safeMessages),
  });
  return result.toUIMessageStreamResponse();
}

function buildPdfAttachmentContext(extracted: {
  price: number;
  beds: number;
  baths: number;
  address: string;
  description: string | null;
}): string {
  const lines = [
    '## User-attached listing (from PDF)',
    `- Price: $${extracted.price.toLocaleString()}`,
    `- Beds: ${extracted.beds}, Baths: ${extracted.baths}`,
    `- Address: ${extracted.address}`,
    extracted.description ? `- Description: ${extracted.description}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export async function POST(req: Request) {
  let messages: unknown;
  let pdfBase64: string | undefined;
  try {
    const body = (await req.json()) as { messages?: unknown; pdf?: string };
    messages = body?.messages ?? [];
    pdfBase64 = typeof body?.pdf === 'string' ? body.pdf : undefined;
  } catch {
    messages = [{ role: 'user' as const, content: 'Hi' }];
  }

  const msgArray = messages as Array<{ role?: string; content?: string; parts?: unknown[] }>;
  const lastUser = [...msgArray].reverse().find((m) => m.role === 'user');
  const lastUserText = typeof lastUser?.content === 'string' ? lastUser.content : '';

  if (lastUserText && hasPhoneNumber(lastUserText) && isQualifiedLead(msgArray)) {
    console.log('[ListingOS] Action: Sending lead details to Command...', {
      phone: lastUserText,
      timestamp: new Date().toISOString(),
    });
  }

  let system = systemPrompt;
  if (pdfBase64) {
    try {
      const buffer = Buffer.from(pdfBase64, 'base64');
      const parsed = await parseListingFromPdfBuffer(buffer);
      if (parsed.ok) {
        system = `${systemPrompt}\n\n${buildPdfAttachmentContext(parsed.data)}`;
        // Persist to DB for troubleshooting (full JSON stored in extractedJson)
        const realtorId =
          process.env.PDF_LISTING_REALTOR_ID ??
          (await prisma.realtor.findFirst({ select: { id: true } }))?.id;
        if (realtorId) {
          await prisma.listing.create({
            data: {
              realtorId,
              price: parsed.data.price,
              beds: parsed.data.beds,
              baths: parsed.data.baths,
              address: parsed.data.address,
              description: parsed.data.description ?? undefined,
              extractedJson: parsed.data as unknown as object,
            },
          });
        }
      }
    } catch (e) {
      console.warn('[chat] PDF parse failed:', e);
    }
  }

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages: await convertToModelMessages(msgArray as Parameters<typeof convertToModelMessages>[0]),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[chat] Error:', err);
    return streamFriendlyErrorResponse(messages);
  }
}
