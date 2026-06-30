import { getPublicErrorMessage } from "@/utils/errors";

export function getSafeAiErrorMessage(error: unknown, fallbackMessage: string): string {
  const message = getPublicErrorMessage(error, "AI_ERROR");

  return message && message !== "AI 生成失败。" ? message : fallbackMessage;
}
