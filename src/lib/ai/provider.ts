import { anthropic } from '@ai-sdk/anthropic';

// Thin seam around the model provider.
// Everything else imports `brain` from here — never @ai-sdk/anthropic directly.
// Swap provider or model in one place; the rest of the harness is untouched.
export const brain = anthropic('claude-sonnet-4-6');
