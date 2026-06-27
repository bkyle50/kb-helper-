import { generateText } from 'ai';
import { brain } from '@/lib/ai/provider';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response('ANTHROPIC_API_KEY is not set', { status: 500 });
  }
  try {
    const { text } = await generateText({
      model: brain,
      prompt: 'Say OK',
      maxOutputTokens: 5,
    });
    return new Response(`OK — model replied: ${text}`, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`API error: ${msg}`, { status: 500 });
  }
}
