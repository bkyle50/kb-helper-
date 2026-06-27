import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { UIMessage } from 'ai';
import { brain } from '@/lib/ai/provider';
import { systemPrompt } from '@/lib/ai/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  let messages: UIMessage[];

  try {
    ({ messages } = await req.json());
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  console.log('[Trillion] key present:', hasKey, '| msgs:', messages?.length);

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: brain,
    system: systemPrompt,
    messages: modelMessages,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError(error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Trillion] stream error:', msg);
        return msg;
      },
    }),
  });
}
