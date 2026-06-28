import { createAnthropic } from '@ai-sdk/anthropic';

// Thin seam around the model provider.
// Everything else imports `brain` from here — never @ai-sdk/anthropic directly.
// Swap provider or model in one place; the rest of the harness is untouched.
const client = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' });
export const brain = client('claude-opus-4-8');
