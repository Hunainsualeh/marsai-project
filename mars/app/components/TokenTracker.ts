/**
 * TokenTracker — localStorage-based per-model daily token usage tracker.
 * Resets at midnight UTC.
 */

const STORAGE_KEY = 'mars_token_usage';

interface ModelUsage {
  date: string; // YYYY-MM-DD UTC
  tokens: number;
  messages: number;
}

type UsageStore = Record<string, ModelUsage>;

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

function loadStore(): UsageStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: UsageStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* storage full — ignore */ }
}

function getOrCreate(store: UsageStore, modelId: string): ModelUsage {
  const today = todayUTC();
  const existing = store[modelId];
  if (existing && existing.date === today) return existing;
  // New day or first use — reset
  return { date: today, tokens: 0, messages: 0 };
}

export const TokenTracker = {
  addUsage(modelId: string, tokens: number): void {
    const store = loadStore();
    const usage = getOrCreate(store, modelId);
    usage.tokens += tokens;
    usage.messages += 1;
    store[modelId] = usage;
    saveStore(store);
  },

  getUsage(modelId: string): ModelUsage {
    const store = loadStore();
    return getOrCreate(store, modelId);
  },

  getRemainingTokens(modelId: string, dailyLimit: number): number {
    const usage = TokenTracker.getUsage(modelId);
    return Math.max(0, dailyLimit - usage.tokens);
  },

  getUsagePercent(modelId: string, dailyLimit: number): number {
    const usage = TokenTracker.getUsage(modelId);
    return Math.min(100, Math.round((usage.tokens / dailyLimit) * 100));
  },

  getAllUsage(): UsageStore {
    return loadStore();
  },

  resetModel(modelId: string): void {
    const store = loadStore();
    delete store[modelId];
    saveStore(store);
  },
};
