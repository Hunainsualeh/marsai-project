// Shared model definitions — safe to import in both client and server components

export const AVAILABLE_MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    badge: 'Logic Core',
    description: 'Best for deep reasoning, code, and complex tasks',
    color: '#60A5FA',
    dailyTokenLimit: 100_000,
    contextWindow: 32_768,
    rpm: 30,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    badge: 'Reflex',
    description: 'Best for fast replies, quick Q&A, and lightweight tasks',
    color: '#FCD34D',
    dailyTokenLimit: 500_000,
    contextWindow: 128_000,
    rpm: 30,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    badge: 'Nexus',
    description: 'Best for long contexts, multilingual tasks, and balanced output',
    color: '#C084FC',
    dailyTokenLimit: 500_000,
    contextWindow: 32_768,
    rpm: 30,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    badge: 'Polymath',
    description: 'Best for instruction following, structured output, and efficiency',
    color: '#34D399',
    dailyTokenLimit: 500_000,
    contextWindow: 8_192,
    rpm: 30,
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    badge: 'Visionary',
    description: 'Best for image analysis and multimodal tasks. Can SEE images.',
    color: '#FB7185',
    dailyTokenLimit: 100_000,
    contextWindow: 128_000,
    rpm: 30,
  },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];
export const DEFAULT_MODEL: ModelId = 'llama-3.3-70b-versatile';
