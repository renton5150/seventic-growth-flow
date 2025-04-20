
export interface CorsConfig {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Headers": string;
}

export interface ModelsConfig {
  OPUS: string;
  SONNET: string;
  HAIKU: string;
}

export interface SystemPromptType {
  "analyze-request": string;
  "generate-summary": string;
  "suggest-assignments": string;
  "find-similarities": string;
  [key: string]: string;
}

export interface AnthropicResponse {
  content: Array<{ text: string }>;
}
