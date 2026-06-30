import type { AIGenerateInput, AIGenerateResult } from "@/types/ai";

export interface AIProvider {
  generate(input: AIGenerateInput): Promise<AIGenerateResult>;
}
