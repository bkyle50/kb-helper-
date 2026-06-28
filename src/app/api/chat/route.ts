import { streamText, convertToModelMessages, toUIMessageStream, createUIMessageStreamResponse, isStepCount } from 'ai';
import type { UIMessage } from 'ai';
import { brain } from '@/lib/ai/provider';
import { systemPrompt } from '@/lib/ai/system-prompt';
import { buildMemoryContext } from '@/lib/ai/memory';
import { tools } from '@/lib/ai/tools';

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

  const [modelMessages, memoryContext] = await Promise.all([
    convertToModelMessages(messages),
    buildMemoryContext(),
  ]);

  const result = streamText({
    model: brain,
    system: systemPrompt + memoryContext,
    messages: modelMessages,
    tools,
    stopWhen: isStepCount(5),
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
