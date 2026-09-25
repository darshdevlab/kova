export const providerKinds = ["openai", "anthropic", "openrouter", "ollama", "custom"] as const;
export type ProviderKind = typeof providerKinds[number];
export type ProviderModel = { id: string; name: string; contextLength?: number };
export type ConnectionSummary = {
  id: string; spaceId: string; provider: ProviderKind; label: string; baseUrl: string;
  hasCredential: boolean; updatedAt: string;
};
export type ProviderListing = { available: boolean; reason?: string; canManage: boolean; connections: ConnectionSummary[] };
