import { generateText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { brain } from '@/lib/ai/provider';
import { systemPrompt } from '@/lib/ai/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Trillion] ANTHROPIC_API_KEY is not set');
    return new Response('Server misconfiguration: missing API key', { status: 500 });
  }

  let messages: UIMessage[];

  try {
    ({ messages } = await req.json());
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  console.log('[Trillion] messages count:', messages.length);

  const modelMessages = await convertToModelMessages(messages);

  console.log('[Trillion] modelMessages count:', modelMessages.length);

  try {
    const result = await generateText({
      model: brain,
      system: systemPrompt,
      messages: modelMessages,
    });
    console.log('[Trillion] got response:', result.text.slice(0, 50));
    return Response.json({ text: result.text });
  } catch (err) {
    console.error('[Trillion] generateText error:', err);
    return new Response(String(err), { status: 500 });
  }
}
