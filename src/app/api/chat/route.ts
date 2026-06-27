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

  console.log('[Trillion] messages count:', messages.length);

  const modelMessages = await convertToModelMessages(messages);

  console.log('[Trillion] modelMessages count:', modelMessages.length);

  const result = streamText({
    model: brain,
    system: systemPrompt,
    messages: modelMessages,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError(error) {
        console.error('[Trillion] stream error:', error);
        return 'An error occurred. Please try again.';
      },
    }),
  });
}
