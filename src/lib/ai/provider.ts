import { createAnthropic } from '@ai-sdk/anthropic';

const client = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' });
export const brain = client('claude-opus-4-8');
