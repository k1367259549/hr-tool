import { createHash } from "node:crypto";

export function generateResumeContentHash(text: string | null | undefined): string | null {
  const normalizedText = normalizeResumeContentForHash(text);

  if (!normalizedText) {
    return null;
  }

  return createHash("sha256").update(normalizedText, "utf8").digest("hex");
}

function normalizeResumeContentForHash(text: string | null | undefined): string | null {
  if (text == null) {
    return null;
  }

  const normalizedText = text.replace(/\r\n?/g, "\n").trim();

  return normalizedText.length > 0 ? normalizedText : null;
}
