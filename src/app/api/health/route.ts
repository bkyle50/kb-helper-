import { brain } from '@/lib/ai/provider';
import { generateText } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  const nodeEnv = process.env.NODE_ENV;
  const keyStatus = !key
    ? 'missing'
    : key.trim() === ''
    ? 'empty string'
    : `present (length ${key.length}, starts with ${key.slice(0, 10)}...)`;

  if (!key || key.trim() === '') {
    return new Response(
      JSON.stringify({ keyStatus, nodeEnv }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    const { text } = await generateText({
      model: brain,
      prompt: 'Say OK',
      maxOutputTokens: 5,
    });
    return new Response(
      JSON.stringify({ keyStatus, nodeEnv, modelReply: text }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ keyStatus, nodeEnv, apiError: msg }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
