
import { CorsConfig, ModelsConfig } from "./types.ts";

export const corsHeaders: CorsConfig = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const MODELS: ModelsConfig = {
  OPUS: "claude-3-opus-20240229",
  SONNET: "claude-3-sonnet-20240229",
  HAIKU: "claude-3-haiku-20240307"
};

export const MAX_TOKENS_TO_SAMPLE = 4096;
export const MAX_CONTEXT_TOKENS = 200000;
