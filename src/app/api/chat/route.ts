import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';

const systemPrompt = `You are an AI Inside Sales Agent (ISA) for a top-producing Keller Williams team.
Your goal is to schedule a 15-minute listing consultation.
You are knowledgeable about the local market.
If asked about commission, say "We discuss commission in person to ensure it fits your goals."
Keep responses under 3 sentences. Be friendly but professional.`;

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

export async function POST(req: Request) {
  let messages: unknown;
  try {
    const body = await req.json();
    messages = body?.messages ?? [];
  } catch {
    messages = [{ role: 'user' as const, content: 'Hi' }];
  }

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0]),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[chat] Error:', err);
    return streamFriendlyErrorResponse(messages);
  }
}
