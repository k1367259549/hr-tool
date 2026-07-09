import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("CandidateDetail interview scheduling entry", () => {
  it("keeps interview scheduling as a manual HR-confirmed frontend action", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/candidate-crm/components/CandidateDetail.tsx"),
      "utf8"
    );

    expect(source).toContain("安排面试");
    expect(source).toContain("确认安排面试");
    expect(source).toContain("window.confirm");
    expect(source).toContain("/api/interviews/schedule");
    expect(source).toContain("不会自动给候选人发消息");
    expect(source).not.toContain("FEISHU_APP_SECRET");
    expect(source).not.toContain("FEISHU_APP_ID");
    expect(source).not.toContain("appSecret");
  });
});

