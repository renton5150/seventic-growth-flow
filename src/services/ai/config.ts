
export const anthropicConfig = {
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-3-haiku-20240307',
  maxTokens: 1000
};

// Fallback for when API key is not available
export const isAnthropicConfigured = () => {
  return !!anthropicConfig.apiKey;
};
