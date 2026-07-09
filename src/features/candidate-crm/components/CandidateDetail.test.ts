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
    expect(source).toContain("面试日程已创建，但飞书表格同步失败。请不要重复预约，可重试同步。");
    expect(source).toContain("重试同步表格");
    expect(source).toContain("/api/interviews/schedule/retry-sync");
    expect(source).toContain("window.confirm");
    expect(source).toContain("/api/interviews/schedule");
    expect(source).toContain("不会重复创建面试日程");
    expect(source).toContain("不会自动给候选人发消息");
    expect(source).not.toContain("FEISHU_APP_SECRET");
    expect(source).not.toContain("FEISHU_APP_ID");
    expect(source).not.toContain("appSecret");
  });
});
