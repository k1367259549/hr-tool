import { describe, expect, it } from "vitest";
import { formatFileSize } from "@/features/candidate-crm/components/CandidateResumeLinkPanel";

describe("CandidateResumeLinkPanel utilities", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
