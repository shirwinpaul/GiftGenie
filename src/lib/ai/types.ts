import type { ProviderName } from "./errors";

export interface GenerateRequest {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
}

/** A text model that returns a JSON string (or throws an AIError). */
export interface AIProvider {
  name: ProviderName;
  generate(req: GenerateRequest): Promise<string>;
}
